import mongoose from "mongoose";
import { Analysis } from "../../models/Analysis.js";
import { SafetyReport } from "../../models/SafetyReport.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class CausalGraphService {
  /**
   * Builds full multi-report causal graph or filtered subgraph.
   */
  static async buildEnterpriseGraph({
    minWeight = 1,
    site = null,
    precursor = null,
    reportId = null,
  } = {}) {
    logger.info("Building SIF Precursor Causal Graph...");

    if (mongoose.connection.readyState !== 1) {
      return CausalGraphService.getMockGraphPayload();
    }

    const query = { isLatest: true };
    if (reportId) query.reportId = reportId;

    const analyses = await Analysis.find(query);
    if (!analyses || analyses.length === 0) {
      return CausalGraphService.getMockGraphPayload();
    }

    // Hydrate report metadata for site filter if needed
    const reportMap = new Map();
    if (site) {
      const reports = await SafetyReport.find({
        reportId: { $in: analyses.map((a) => a.reportId) },
        "normalizedReport.site": site,
      });
      for (const r of reports) reportMap.set(r.reportId, r);
    }

    const nodesMap = new Map();
    const edgesMap = new Map();

    const addNode = (id, label, type, weight = 1, metadata = {}) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, label, type, weight, metadata });
      } else {
        nodesMap.get(id).weight += weight;
      }
    };

    const addEdge = (source, target, relationship, evidence = "") => {
      const edgeId = `${source}->${target}:${relationship}`;
      if (!edgesMap.has(edgeId)) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source,
          target,
          relationship,
          weight: 1,
          evidenceSnippets: evidence ? [evidence] : [],
        });
      } else {
        const edge = edgesMap.get(edgeId);
        edge.weight += 1;
        if (evidence && !edge.evidenceSnippets.includes(evidence)) {
          edge.evidenceSnippets.push(evidence);
        }
      }
    };

    for (const analysis of analyses) {
      if (site && !reportMap.has(analysis.reportId)) continue;

      const eventNodeId = `event_${analysis.reportId}`;
      addNode(eventNodeId, analysis.reportId, "EVENT", 1, {
        riskScore: analysis.riskScore?.score,
        sifClassification: analysis.sifClassification?.classification,
      });

      const precursors = analysis.precursors || [];
      const energySources = analysis.nlpExtraction?.energySources || [];
      const unsafeActs = analysis.nlpExtraction?.unsafeActs || [];
      const barriers = analysis.nlpExtraction?.barriers || [];
      const lsrMappings = analysis.lifeSavingRuleMappings || [];
      const consequence = analysis.nlpExtraction?.consequences?.worstCaseConsequence || "Serious Injury / Fatality";

      const consequenceNodeId = `cons_${consequence.replace(/\s+/g, "_").toLowerCase().substring(0, 30)}`;
      addNode(consequenceNodeId, consequence, "CONSEQUENCE", 1);

      // 1. Process Precursor Nodes & Event Edges
      for (const p of precursors) {
        if (precursor && p.type !== precursor) continue;

        const precNodeId = `prec_${p.type}`;
        addNode(precNodeId, p.type.replace(/_/g, " "), "PRECURSOR", 1, { severity: p.severity });
        addEdge(eventNodeId, precNodeId, "ASSOCIATED_WITH", p.evidenceText);

        // 2. Connect Energy Sources -> Precursor (CAUSES)
        for (const energy of energySources) {
          const energyNodeId = `energy_${energy.type.replace(/\s+/g, "_").toLowerCase()}`;
          addNode(energyNodeId, energy.type, "ENERGY_SOURCE", 1);
          addEdge(energyNodeId, precNodeId, "CAUSES");
        }

        // 3. Connect Unsafe Acts -> Precursor (CAUSES)
        for (const act of unsafeActs) {
          const actNodeId = `act_${act.replace(/\s+/g, "_").toLowerCase().substring(0, 30)}`;
          addNode(actNodeId, act, "UNSAFE_ACT", 1);
          addEdge(actNodeId, precNodeId, "CAUSES");
        }

        // 4. Connect Precursor -> Failed Barriers (FAILS)
        const failedBarriers = barriers.filter((b) => b.status === "FAILED" || b.status === "MISSING");
        for (const b of failedBarriers) {
          const barrierNodeId = `barrier_${b.name.replace(/\s+/g, "_").toLowerCase().substring(0, 30)}`;
          addNode(barrierNodeId, b.name, "BARRIER", 1, { status: b.status, category: b.category });
          addEdge(precNodeId, barrierNodeId, "FAILS", b.evidenceText);
          addEdge(barrierNodeId, consequenceNodeId, "LEADS_TO");
        }

        // 5. Connect Precursor -> IOGP Life-Saving Rules (VIOLATES)
        for (const lsr of lsrMappings) {
          const lsrNodeId = `lsr_${lsr.ruleId}`;
          addNode(lsrNodeId, lsr.ruleName, "LIFE_SAVING_RULE", 1, { ruleId: lsr.ruleId });
          addEdge(precNodeId, lsrNodeId, "VIOLATES", lsr.evidenceText);
        }
      }
    }

    const filteredEdges = Array.from(edgesMap.values()).filter((e) => e.weight >= minWeight);
    const nodes = Array.from(nodesMap.values());
    const pathways = CausalGraphService.extractHighRiskPathways(nodes, filteredEdges);

    return {
      scope: reportId ? "REPORT" : precursor ? "PRECURSOR" : site ? "SITE" : "ENTERPRISE",
      targetIdentifier: reportId || precursor || site || "ALL",
      nodeCount: nodes.length,
      edgeCount: filteredEdges.length,
      nodes,
      edges: filteredEdges,
      highRiskPathways: pathways,
      cytoscapeElements: CausalGraphService.formatCytoscapePayload(nodes, filteredEdges),
    };
  }

  /**
   * Find and rank high-risk causal pathways from Energy Source/Unsafe Act -> Precursor -> Failed Barrier -> Consequence.
   */
  static extractHighRiskPathways(nodes = [], edges = []) {
    const pathways = [];

    // Find all FAILS edges: (PRECURSOR -> BARRIER)
    const failsEdges = edges.filter((e) => e.relationship === "FAILS");

    for (const failEdge of failsEdges) {
      const precNode = nodes.find((n) => n.id === failEdge.source);
      const barrierNode = nodes.find((n) => n.id === failEdge.target);

      if (precNode && barrierNode) {
        // Find cause edge leading into precursor
        const causeEdge = edges.find((e) => e.target === precNode.id && e.relationship === "CAUSES");
        const causeNode = causeEdge ? nodes.find((n) => n.id === causeEdge.source) : null;

        const pathRiskScore = Math.min(100, Math.round(50 + (failEdge.weight * 10) + (causeEdge ? causeEdge.weight * 5 : 0)));

        pathways.push({
          pathwayId: `PATH-${precNode.label.substring(0, 4).toUpperCase()}-${barrierNode.id.substring(0, 8)}`,
          triggerCause: causeNode ? causeNode.label : "Hazardous Operation",
          precursor: precNode.label,
          failedBarrier: barrierNode.label,
          potentialConsequence: "Fatal Injury / Catastrophic Incident",
          pathRiskScore,
          chainDescription: `${causeNode ? causeNode.label : "Hazardous Work"} ➔ ${precNode.label} ➔ Barrier Failure (${barrierNode.label}) ➔ Life-Altering Consequence`,
          occurrenceFrequency: failEdge.weight,
        });
      }
    }

    // Sort descending by pathRiskScore
    pathways.sort((a, b) => b.pathRiskScore - a.pathRiskScore);
    return pathways.slice(0, 10);
  }

  /**
   * Format standard Cytoscape.js visualization structure.
   */
  static formatCytoscapePayload(nodes = [], edges = []) {
    return {
      nodes: nodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          weight: n.weight,
          ...n.metadata,
        },
      })),
      edges: edges.map((e) => ({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          relationship: e.relationship,
          weight: e.weight,
        },
      })),
    };
  }

  /**
   * Return rich mock graph payload for offline/testing mode.
   */
  static getMockGraphPayload() {
    const nodes = [
      { id: "energy_electrical_440v", label: "Electrical Energy (440V)", type: "ENERGY_SOURCE", weight: 3 },
      { id: "act_omitted_loto", label: "Omitted LOTO Verification", type: "UNSAFE_ACT", weight: 3 },
      { id: "prec_electrical_exposure", label: "Electrical Exposure", type: "PRECURSOR", weight: 3 },
      { id: "prec_working_at_height", label: "Working at Height", type: "PRECURSOR", weight: 4 },
      { id: "barrier_loto", label: "Lockout / Tagout (LOTO)", type: "BARRIER", weight: 3 },
      { id: "barrier_harness", label: "100% Fall Arrest Harness", type: "BARRIER", weight: 4 },
      { id: "lsr_energy_isolation", label: "Energy Isolation", type: "LIFE_SAVING_RULE", weight: 3 },
      { id: "lsr_working_at_height", label: "Working at Height", type: "LIFE_SAVING_RULE", weight: 4 },
      { id: "cons_fatal_shock", label: "Fatal Electric Shock / Arc Flash", type: "CONSEQUENCE", weight: 3 },
      { id: "cons_fatal_fall", label: "Fatal Fall from Height", type: "CONSEQUENCE", weight: 4 },
    ];

    const edges = [
      { id: "e1", source: "energy_electrical_440v", target: "prec_electrical_exposure", relationship: "CAUSES", weight: 3, evidenceSnippets: [] },
      { id: "e2", source: "act_omitted_loto", target: "prec_electrical_exposure", relationship: "CAUSES", weight: 3, evidenceSnippets: [] },
      { id: "e3", source: "prec_electrical_exposure", target: "barrier_loto", relationship: "FAILS", weight: 3, evidenceSnippets: [] },
      { id: "e4", source: "prec_electrical_exposure", target: "lsr_energy_isolation", relationship: "VIOLATES", weight: 3, evidenceSnippets: [] },
      { id: "e5", source: "barrier_loto", target: "cons_fatal_shock", relationship: "LEADS_TO", weight: 3, evidenceSnippets: [] },
      { id: "e6", source: "prec_working_at_height", target: "barrier_harness", relationship: "FAILS", weight: 4, evidenceSnippets: [] },
      { id: "e7", source: "prec_working_at_height", target: "lsr_working_at_height", relationship: "VIOLATES", weight: 4, evidenceSnippets: [] },
      { id: "e8", source: "barrier_harness", target: "cons_fatal_fall", relationship: "LEADS_TO", weight: 4, evidenceSnippets: [] },
    ];

    const pathways = CausalGraphService.extractHighRiskPathways(nodes, edges);

    return {
      scope: "ENTERPRISE",
      targetIdentifier: "ALL",
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodes,
      edges,
      highRiskPathways: pathways,
      cytoscapeElements: CausalGraphService.formatCytoscapePayload(nodes, edges),
    };
  }
}

export default CausalGraphService;
