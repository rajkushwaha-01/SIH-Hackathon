import { describe, it, expect } from "vitest";
import { AnalyticsService } from "../../src/services/analytics/AnalyticsService.js";

describe("Phase 15 - Executive Dashboard & Analytics Unit Tests", () => {
  it("should calculate executive KPI metrics with valid rates and counts", async () => {
    const kpis = await AnalyticsService.getExecutiveKpis();

    expect(kpis).toHaveProperty("totalReports");
    expect(kpis).toHaveProperty("sifPotentialCount");
    expect(kpis).toHaveProperty("sifRate");
    expect(kpis.sifRate).toBeGreaterThanOrEqual(0);
    expect(kpis.sifRate).toBeLessThanOrEqual(100);
    expect(kpis.barrierHealthScore).toBeGreaterThanOrEqual(0);
  });

  it("should generate breakdown by site with calculated averages", async () => {
    const siteData = await AnalyticsService.getBreakdownBySite();

    expect(siteData.length).toBeGreaterThan(0);
    const firstSite = siteData[0];

    expect(firstSite).toHaveProperty("site");
    expect(firstSite).toHaveProperty("totalReports");
    expect(firstSite).toHaveProperty("sifCount");
    expect(firstSite).toHaveProperty("sifRate");
    expect(firstSite).toHaveProperty("avgRiskScore");
  });

  it("should generate breakdown by precursor taxonomy type", async () => {
    const precData = await AnalyticsService.getBreakdownByPrecursor();

    expect(precData.length).toBeGreaterThan(0);
    const firstPrec = precData[0];

    expect(firstPrec).toHaveProperty("precursor");
    expect(firstPrec).toHaveProperty("count");
    expect(firstPrec).toHaveProperty("sifRate");
  });

  it("should generate barrier health analytics with top failing barrier lists", async () => {
    const barrierData = await AnalyticsService.getBarrierHealthAnalytics();

    expect(barrierData).toHaveProperty("overallResilienceScore");
    expect(barrierData).toHaveProperty("statusBreakdown");
    expect(barrierData).toHaveProperty("hierarchyBreakdown");
    expect(barrierData).toHaveProperty("topFailedBarriers");
    expect(Array.isArray(barrierData.topFailedBarriers)).toBe(true);
  });

  it("should assemble unified executive dashboard payload in single call", async () => {
    const dashboard = await AnalyticsService.getFullExecutiveDashboard();

    expect(dashboard).toHaveProperty("kpis");
    expect(dashboard).toHaveProperty("bySite");
    expect(dashboard).toHaveProperty("byPrecursor");
    expect(dashboard).toHaveProperty("trends");
    expect(dashboard).toHaveProperty("barrierHealth");
  });
});
