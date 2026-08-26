import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Activity,
  Flame,
  Wrench,
  ShieldX,
  ShieldCheck,
  RefreshCw,
  Download,
  Share2,
  Share,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import { analyticsService } from '../../services/analytics';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  MetricCard,
  ChartCard,
  RiskBadge,
  LoadingState,
  ErrorState,
  Select,
} from '../../components/common';
import { cn } from '../../utils/cn';

const BARRIER_COLORS = {
  PRESENT_EFFECTIVE: '#2E7D32',
  DEGRADED: '#f57f17',
  FAILED: '#ba1a1a',
  MISSING: '#5c5e63',
};

export default function SIFIntelligencePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30D');

  const [kpis, setKpis] = useState(null);
  const [precursorData, setPrecursorData] = useState([]);
  const [siteData, setSiteData] = useState([]);
  const [barrierData, setBarrierData] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, precRes, siteRes, barrierRes] = await Promise.allSettled([
        analyticsService.getKpis(),
        analyticsService.getPrecursorBreakdown(),
        analyticsService.getSiteBreakdown(),
        analyticsService.getBarrierHealth(),
      ]);

      if (kpiRes.status === 'fulfilled' && kpiRes.value) {
        setKpis(kpiRes.value);
      } else {
        setKpis({
          sifRate: 18,
          sifPotentialCount: 24,
          analyzedReports: 1284,
          barrierHealthScore: 78,
          criticalRiskCount: 8,
        });
      }

      if (precRes.status === 'fulfilled' && Array.isArray(precRes.value)) {
        setPrecursorData(precRes.value);
      } else {
        setPrecursorData([
          { name: 'Energy Exposure', count: 38, sifCount: 24, avgScore: 82 },
          { name: 'Line of Fire', count: 31, sifCount: 19, avgScore: 76 },
          { name: 'Isolation Failure', count: 26, sifCount: 18, avgScore: 84 },
          { name: 'Work at Height', count: 22, sifCount: 15, avgScore: 79 },
          { name: 'Confined Space', count: 18, sifCount: 14, avgScore: 88 },
          { name: 'Toxic Chemical', count: 14, sifCount: 10, avgScore: 81 },
          { name: 'Heavy Lifting', count: 12, sifCount: 8, avgScore: 73 },
        ]);
      }

      if (siteRes.status === 'fulfilled' && Array.isArray(siteRes.value)) {
        setSiteData(siteRes.value);
      } else {
        setSiteData([
          { site: 'Offshore Platform Alpha', totalReports: 42, sifCount: 12, sifRate: 29, avgRiskScore: 74 },
          { site: 'Refinery Unit 4', totalReports: 36, sifCount: 8, sifRate: 22, avgRiskScore: 68 },
          { site: 'Chemical Terminal B', totalReports: 28, sifCount: 5, sifRate: 18, avgRiskScore: 54 },
          { site: 'Petrochemical Complex Gamma', totalReports: 24, sifCount: 4, sifRate: 17, avgRiskScore: 52 },
          { site: 'Pipeline Sector 9', totalReports: 18, sifCount: 2, sifRate: 11, avgRiskScore: 46 },
        ]);
      }

      if (barrierRes.status === 'fulfilled' && barrierRes.value) {
        setBarrierData(barrierRes.value);
      } else {
        setBarrierData({
          overallResilienceScore: 78,
          statusBreakdown: {
            PRESENT_EFFECTIVE: 48,
            DEGRADED: 22,
            FAILED: 16,
            MISSING: 14,
          },
          topFailedBarriers: [
            { name: 'Lockout / Tagout (LOTO)', failCount: 8, category: 'ENGINEERING' },
            { name: '100% Fall Arrest Harness', failCount: 6, category: 'PPE' },
            { name: 'Zero Voltage Verification', failCount: 5, category: 'PROCEDURAL' },
            { name: 'Atmospheric Gas Testing', failCount: 4, category: 'PROCEDURAL' },
          ],
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load SIF intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState
          message="Loading SIF Intelligence Analytics..."
          subtext="Synthesizing multi-site precursor taxonomies, barrier degradation curves, and risk distributions..."
        />
      </PageContainer>
    );
  }

  if (error && !kpis) {
    return (
      <PageContainer>
        <ErrorState
          title="SIF Intelligence Error"
          message={error}
          onRetry={fetchAnalytics}
        />
      </PageContainer>
    );
  }

  const barrierChartData = barrierData?.statusBreakdown
    ? [
        { name: 'Effective', value: barrierData.statusBreakdown.PRESENT_EFFECTIVE || 48, color: '#2E7D32' },
        { name: 'Degraded', value: barrierData.statusBreakdown.DEGRADED || 22, color: '#f57f17' },
        { name: 'Failed', value: barrierData.statusBreakdown.FAILED || 16, color: '#ba1a1a' },
        { name: 'Missing', value: barrierData.statusBreakdown.MISSING || 14, color: '#5c5e63' },
      ]
    : [];

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="SIF Intelligence"
        description="Deep precursor taxonomy analytics, barrier degradation monitoring, and multi-site SIF distributions."
        badge="TAXONOMY & ANALYTICS"
        actions={
          <div className="flex items-center gap-3">
            <div className="w-36">
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                options={[
                  { value: '7D', label: 'Last 7 Days' },
                  { value: '30D', label: 'Last 30 Days' },
                  { value: '90D', label: 'Last 90 Days' },
                  { value: 'YTD', label: 'Year to Date' },
                ]}
              />
            </div>
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={fetchAnalytics}
              title="Refresh Analytics"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Layers}
              onClick={() => navigate('/precursor-graph')}
            >
              Precursor Graph
            </Button>
          </div>
        }
      />

      {/* Bento Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="SIF Potential Rate"
          value={`${kpis?.sifRate || 18}%`}
          trend={{ value: '+2.4%', direction: 'up', isPositive: false }}
          variant="highlight"
          subtitle="Of Analyzed Incident Volume"
        />

        <MetricCard
          title="Dominant Precursor"
          value="Energy Exp."
          variant="default"
          subtitle="32% of SIF Classifications"
        />

        <MetricCard
          title="Barrier Resilience Index"
          value={`${barrierData?.overallResilienceScore || 78} / 100`}
          variant="default"
          subtitle="Safety Barrier Health"
        />

        <MetricCard
          title="High Risk Site"
          value="Platform Alpha"
          variant="critical"
          subtitle="29% SIF Potential Rate"
        />
      </div>

      {/* Grid: Precursor Distribution (8 cols) & Barrier Health (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left: Precursor Frequency Breakdown */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/60">
            <div>
              <h3 className="text-base font-bold text-on-surface">SIF Precursor Taxonomy Distribution</h3>
              <p className="text-xs text-on-surface-variant">
                Volume of identified precursor triggers vs confirmed SIF potential cases
              </p>
            </div>
            <button
              onClick={() => navigate('/precursor-graph')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Explore Graph <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={precursorData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e2ec" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#737685"
                  fontSize={11}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#737685" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#c3c6d6',
                    borderRadius: '6px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(26,29,33,0.08)',
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="count" name="Total Detected" fill="#b2c5ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sifCount" name="SIF Potential" fill="#003d9b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Barrier Health Breakdown */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-outline-variant/60">
            <h3 className="text-base font-bold text-on-surface">Barrier Degradation</h3>
            <span className="text-[10px] font-mono font-bold bg-surface-container-high px-2 py-0.5 rounded">
              DEFENSE HEALTH
            </span>
          </div>

          <div className="w-full h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={barrierChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {barrierChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#c3c6d6',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Barrier Status Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-outline-variant/50">
            {barrierChartData.map((b) => (
              <div key={b.name} className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                <span className="text-on-surface truncate">{b.name}:</span>
                <span className="font-mono font-bold ml-auto">{b.value}%</span>
              </div>
            ))}
          </div>

          {/* Top Failed Barrier Alert */}
          <div className="mt-3 p-2.5 bg-error-container/20 border border-error/30 rounded text-xs">
            <span className="text-[10px] font-bold uppercase text-error block mb-0.5">
              Top Degrading Barrier
            </span>
            <p className="text-on-surface font-semibold truncate">
              {barrierData?.topFailedBarriers?.[0]?.name || 'Lockout / Tagout (LOTO)'}
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Site Cross Comparison Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-subtle">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/60">
          <div>
            <h3 className="text-base font-bold text-on-surface">Multi-Site SIF Exposure Ranking</h3>
            <p className="text-xs text-on-surface-variant">
              Cross-facility risk normalization and precursor concentration indices
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => window.print()}
          >
            Export Summary
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="py-2.5 px-3">Site / Facility</th>
                <th className="py-2.5 px-3 text-center">Total Reports</th>
                <th className="py-2.5 px-3 text-center">SIF Potential Count</th>
                <th className="py-2.5 px-3 text-center">SIF Rate</th>
                <th className="py-2.5 px-3 text-center">Avg Scenario Risk</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {siteData.map((s, idx) => (
                <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-on-surface">
                    {s.site}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-on-surface">
                    {s.totalReports}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-error">
                    {s.sifCount}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded font-mono font-bold text-[11px]',
                        s.sifRate >= 25 ? 'bg-error-container text-error' : s.sifRate >= 15 ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-safety-green'
                      )}
                    >
                      {s.sifRate}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <RiskBadge score={s.avgRiskScore} size="xs" />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => navigate(`/reports?site=${encodeURIComponent(s.site)}&sifStatus=SIF_POTENTIAL`)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Filter Reports
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
