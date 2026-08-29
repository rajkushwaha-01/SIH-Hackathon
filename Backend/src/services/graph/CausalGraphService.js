import mongoose from "mongoose";
import { Analysis } from "../../models/Analysis.js";
import { SafetyReport } from "../../models/SafetyReport.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class CausalGraphService {
  /**
   * Check if MongoDB is connected; throw error if offline (Rule 20: No Silent Fallback).
   */
  static verifyDbConnection() {
    if (mongoose.connection.readyState !== 1) {
      throw new AppError(
        "Database is offline or disconnected. Cannot generate causal graph.",
        503,
        "DATABASE_DISCONNECTED"
      );
    }
  }

  /**
   * Builds full multi-report causal graph or filtered subgraph dynamically from MongoDB.
   */
  static async buildEnterpriseGraph({
    minWeight = 1,
    site = null,
    precursor = null,
    reportId = null,
  } = {}) {
    CausalGraphService.verifyDbConnection();

    const query = { isLatest: true };
    if (reportId) {
      const isObjectId = reportId.match(/^[0-9a-fA-F]{24}$/);
      let canonicalId = reportId;
      if (isObjectId) {
        const rep = await SafetyReport.findOne({ $or: [{ _id: reportId }, { reportId }] });
        if (rep) canonicalId = rep.reportId;
      }
      query.$or = [{ reportId: canonicalId }, { reportId }];
    }

    const analyses = await Analysis.find(query);
    if (!analyses || analyses.length === 0) {
      return {
        scope: reportId ? "INCIDENT" : "ENTERPRISE",
        targetIdentifier: reportId || "ALL",
        nodeCount: 0,
        edgeCount: 0,
        nodes: [],
        edges: [],
        highRiskPathways: [],
        cytoscapeElements: [],
      };
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

    const addNode = (id, label, type) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, label, type, weight: 0 });
      }
      nodesMap.get(id).weight += 1;
    };

    const addEdge = (sourceId, targetId, relationship, evidenceText) => {
      const edgeId = `${sourceId}__${relationship}__${targetId}`;
      if (!edgesMap.has(edgeId)) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: sourceId,
          target: targetId,
          relationship,
          weight: 0,
          evidenceSnippets: [],
        });
      }
      const edge = edgesMap.get(edgeId);
      edge.weight += 1;
      if (evidenceText && !edge.evidenceSnippets.includes(evidenceText) && edge.evidenceSnippets.length < 3) {
        edge.evidenceSnippets.push(evidenceText);
      }
    };

    for (const a of analyses) {
      if (site && !reportMap.has(a.reportId)) continue;

      const precs = a.precursors || [];
      if (precursor && !precs.some((p) => p.type === precursor)) continue;

      const extraction = a.nlpExtraction || {};

      // 1. Energy Sources -> Precursors
      for (const e of extraction.energySources || []) {
        const eNodeId = `energy_${e.type.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        addNode(eNodeId, `${e.type} Energy`, "ENERGY_SOURCE");

        for (const p of precs) {
          const pNodeId = `prec_${p.type.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
          addNode(pNodeId, p.type.replace(/_/g, " "), "PRECURSOR");
          addEdge(eNodeId, pNodeId, "CAUSES", p.evidenceSnippet);
        }
      }

      // 2. Unsafe Acts -> Precursors
      for (const act of extraction.unsafeActs || []) {
        const actNodeId = `act_${act.toLowerCase().slice(0, 20).replace(/[^a-z0-9]/g, "_")}`;
        addNode(actNodeId, act.slice(0, 35), "UNSAFE_ACT");

        for (const p of precs) {
          const pNodeId = `prec_${p.type.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
          addEdge(actNodeId, pNodeId, "CAUSES");
        }
      }

      // 3. Precursors -> Failed Barriers
      for (const p of precs) {
        const pNodeId = `prec_${p.type.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        addNode(pNodeId, p.type.replace(/_/g, " "), "PRECURSOR");

        for (const b of extraction.barriers || []) {
          if (b.status === "FAILED" || b.status === "MISSING" || b.status === "DEGRADED") {
            const bNodeId = `barrier_${b.name.toLowerCase().slice(0, 20).replace(/[^a-z0-9]/g, "_")}`;
            addNode(bNodeId, b.name, "BARRIER");
            addEdge(pNodeId, bNodeId, "FAILS", b.evidenceText);

            // Barrier -> Consequences
            for (const inj of extraction.consequences?.potentialInjuries || ["Severe Injury / Fatality"]) {
              const cNodeId = `cons_${inj.toLowerCase().slice(0, 20).replace(/[^a-z0-9]/g, "_")}`;
              addNode(cNodeId, inj.slice(0, 35), "CONSEQUENCE");
              addEdge(bNodeId, cNodeId, "LEADS_TO");
            }
          }
        }

        // 4. Precursors -> Life Saving Rules
        for (const lsr of a.lifeSavingRules || []) {
          const lsrNodeId = `lsr_${lsr.ruleId.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
          addNode(lsrNodeId, lsr.name, "LIFE_SAVING_RULE");
          addEdge(pNodeId, lsrNodeId, "VIOLATES", lsr.evidenceText);
        }
      }
    }

    const filteredNodes = Array.from(nodesMap.values()).filter((n) => n.weight >= minWeight);
    const validNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = Array.from(edgesMap.values()).filter(
      (e) => validNodeIds.has(e.source) && validNodeIds.has(e.target) && e.weight >= minWeight
    );

    const highRiskPathways = CausalGraphService.extractHighRiskPathways(filteredNodes, filteredEdges);
    const cytoscapeElements = CausalGraphService.formatCytoscapePayload(filteredNodes, filteredEdges);

    return {
      scope: reportId ? "INCIDENT" : "ENTERPRISE",
      targetIdentifier: reportId || (site ? `Site: ${site}` : "ALL"),
      nodeCount: filteredNodes.length,
      edgeCount: filteredEdges.length,
      nodes: filteredNodes,
      edges: filteredEdges,
      highRiskPathways,
      cytoscapeElements,
    };
  }

  /**
   * Identifies high-risk causal chains (Energy/Act -> Precursor -> Failed Barrier -> Consequence).
   */
  static extractHighRiskPathways(nodes = [], edges = []) {
    const pathways = [];
    const precNodes = nodes.filter((n) => n.type === "PRECURSOR");

    for (const pNode of precNodes) {
      const incomingEdges = edges.filter((e) => e.target === pNode.id && e.relationship === "CAUSES");
      const outgoingFails = edges.filter((e) => e.source === pNode.id && e.relationship === "FAILS");

      for (const inEdge of incomingEdges) {
        for (const outEdge of outgoingFails) {
          const leadsToEdge = edges.find((e) => e.source === outEdge.target && e.relationship === "LEADS_TO");

          const triggerNode = nodes.find((n) => n.id === inEdge.source);
          const barrierNode = nodes.find((n) => n.id === outEdge.target);
          const consequenceNode = leadsToEdge ? nodes.find((n) => n.id === leadsToEdge.target) : null;

          if (triggerNode && barrierNode) {
            const chainWeight = inEdge.weight + outEdge.weight + (leadsToEdge?.weight || 0);
            pathways.push({
              id: `pathway_${triggerNode.id}_${pNode.id}_${barrierNode.id}`,
              triggerCause: triggerNode.label,
              precursor: pNode.label,
              failedBarrier: barrierNode.label,
              consequence: consequenceNode?.label || "Fatal Injury / Catastrophic SIF",
              chainWeight,
              description: `[${triggerNode.label}] triggers [${pNode.label}], breaching [${barrierNode.label}] defense.`,
            });
          }
        }
      }
    }

    return pathways.sort((a, b) => b.chainWeight - a.chainWeight).slice(0, 10);
  }

  /**
   * Converts nodes and edges into Cytoscape.js compatible graph payload.
   */
  static formatCytoscapePayload(nodes = [], edges = []) {
    const elements = [];

    for (const n of nodes) {
      elements.push({
        group: "nodes",
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          weight: n.weight,
        },
      });
    }

    for (const e of edges) {
      elements.push({
        group: "edges",
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          relationship: e.relationship,
          weight: e.weight,
          evidenceSnippets: e.evidenceSnippets,
        },
      });
    }

    return elements;
  }
}

export default CausalGraphService;
