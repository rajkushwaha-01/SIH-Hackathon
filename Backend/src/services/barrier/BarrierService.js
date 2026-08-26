export class BarrierService {
  /**
   * Weights for Hierarchy of Controls.
   */
  static HIERARCHY_WEIGHTS = {
    ELIMINATION: 1.0,
    SUBSTITUTION: 0.9,
    ENGINEERING: 0.8,
    ADMINISTRATIVE: 0.5,
    PROCEDURAL: 0.4,
    PPE: 0.3,
    HUMAN: 0.2,
  };

  /**
   * Effectiveness score by barrier status.
   */
  static STATUS_EFFECTIVENESS = {
    PRESENT_EFFECTIVE: 1.0,
    DEGRADED: 0.4,
    FAILED: 0.0,
    MISSING: 0.0,
  };

  /**
   * Calculates overall barrier resilience score (0-100%).
   */
  static calculateBarrierResilience(barriers = []) {
    if (!barriers || barriers.length === 0) {
      return {
        score: 50,
        status: "UNKNOWN",
        totalBarriers: 0,
        failedCount: 0,
        effectiveCount: 0,
      };
    }

    let totalWeight = 0;
    let earnedWeight = 0;
    let failedCount = 0;
    let effectiveCount = 0;

    for (const barrier of barriers) {
      const hierarchyWeight = BarrierService.HIERARCHY_WEIGHTS[barrier.category] || 0.5;
      const statusMultiplier = BarrierService.STATUS_EFFECTIVENESS[barrier.status] ?? 0.5;

      totalWeight += hierarchyWeight;
      earnedWeight += hierarchyWeight * statusMultiplier;

      if (barrier.status === "FAILED" || barrier.status === "MISSING") {
        failedCount++;
      } else if (barrier.status === "PRESENT_EFFECTIVE") {
        effectiveCount++;
      }
    }

    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 50;
    const status = score >= 80 ? "STRONG" : score >= 50 ? "DEGRADED" : "CRITICAL_DEFICIT";

    return {
      score,
      status,
      totalBarriers: barriers.length,
      failedCount,
      effectiveCount,
    };
  }
}

export default BarrierService;
