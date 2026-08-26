import { describe, it, expect } from "vitest";
import { CausalGraphService } from "../../src/services/graph/CausalGraphService.js";

describe("Phase 12 - SIF Precursor Causal Graph Unit Tests", () => {
  it("should construct valid nodes, edges, and high-risk pathways", async () => {
    const graph = await CausalGraphService.buildEnterpriseGraph();

    expect(graph).toHaveProperty("nodes");
    expect(graph).toHaveProperty("edges");
    expect(graph).toHaveProperty("highRiskPathways");
    expect(graph.nodeCount).toBeGreaterThan(0);
    expect(graph.edgeCount).toBeGreaterThan(0);

    // Verify node types
    const nodeTypes = graph.nodes.map((n) => n.type);
    expect(nodeTypes).toContain("PRECURSOR");
    expect(nodeTypes).toContain("BARRIER");
    expect(nodeTypes).toContain("ENERGY_SOURCE");
    expect(nodeTypes).toContain("CONSEQUENCE");

    // Verify edge relationships
    const edgeRels = graph.edges.map((e) => e.relationship);
    expect(edgeRels).toContain("CAUSES");
    expect(edgeRels).toContain("FAILS");
    expect(edgeRels).toContain("LEADS_TO");
  });

  it("should calculate high-risk causal pathways with chain descriptions", () => {
    const mockNodes = [
      { id: "energy_high_v", label: "High Voltage (440V)", type: "ENERGY_SOURCE", weight: 2 },
      { id: "prec_elec", label: "Electrical Exposure", type: "PRECURSOR", weight: 2 },
      { id: "barrier_loto", label: "LOTO Isolation", type: "BARRIER", weight: 2 },
    ];

    const mockEdges = [
      { id: "e1", source: "energy_high_v", target: "prec_elec", relationship: "CAUSES", weight: 2 },
      { id: "e2", source: "prec_elec", target: "barrier_loto", relationship: "FAILS", weight: 2 },
    ];

    const pathways = CausalGraphService.extractHighRiskPathways(mockNodes, mockEdges);

    expect(pathways.length).toBeGreaterThan(0);
    expect(pathways[0]).toHaveProperty("triggerCause");
    expect(pathways[0]).toHaveProperty("precursor");
    expect(pathways[0]).toHaveProperty("failedBarrier");
    expect(pathways[0].pathRiskScore).toBeGreaterThanOrEqual(50);
    expect(pathways[0].chainDescription).toContain("High Voltage (440V)");
  });

  it("should format Cytoscape.js visualization payload", () => {
    const mockNodes = [{ id: "n1", label: "Node 1", type: "PRECURSOR", weight: 1, metadata: {} }];
    const mockEdges = [{ id: "e1", source: "n1", target: "n2", relationship: "CAUSES", weight: 1 }];

    const payload = CausalGraphService.formatCytoscapePayload(mockNodes, mockEdges);

    expect(payload).toHaveProperty("nodes");
    expect(payload).toHaveProperty("edges");
    expect(payload.nodes[0].data.id).toBe("n1");
    expect(payload.edges[0].data.source).toBe("n1");
  });
});
