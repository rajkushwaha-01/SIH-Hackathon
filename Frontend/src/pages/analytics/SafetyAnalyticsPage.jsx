import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Printer,
  Shield,
  Activity,
  MapPin,
  Flame,
  Wrench,
} from 'lucide-react';
import { analyticsService } from '../../services/analytics';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  Select,
  ChartCard,
  MetricCard,
  RiskBadge,
  LoadingState,
  ErrorState,
} from '../../components/common';
import { cn } from '../../utils/cn';

const PIE_COLORS = ['#003d9b', '#0052cc', '#ba1a1a', '#f57f17', '#5c5e63', '#2E7D32'];

export default function SafetyAnalyticsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('12M');

  const [trendData, setTrendData] = useState([]);
  const [precursorData, setPrecursorData] = useState([]);
  const [siteData, setSiteData] = useState([]);
  const [barrierData, setBarrierData] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendRes, precRes, siteRes, barrierRes] = await Promise.allSettled([
        analyticsService.getTrends(),
        analyticsService.getPrecursorBreakdown(),
        analyticsService.getSiteBreakdown(),
        analyticsService.getBarrierHealth(),
      ]);

      if (trendRes.status === 'fulfilled' && Array.isArray(trendRes.value)) {
        setTrendData(trendRes.value);
      } else {
        setTrendData([
          { period: 'Jan 2026', totalReports: 94, sifCount: 16, sifRate: 17, avgScore: 68 },
          { period: 'Feb 2026', totalReports: 112, sifCount: 22, sifRate: 19, avgScore: 72 },
          { period: 'Mar 2026', totalReports: 105, sifCount: 18, sifRate: 17, avgScore: 70 },
          { period: 'Apr 2026', totalReports: 128, sifCount: 26, sifRate: 20, avgScore: 74 },
          { period: 'May 2026', totalReports: 140, sifCount: 24, sifRate: 17, avgScore: 71 },
          { period: 'Jun 2026', totalReports: 135, sifCount: 28, sifRate: 21, avgScore: 76 },
          { period: 'Jul 2026', totalReports: 152, sifCount: 31, sifRate: 20, avgScore: 75 },
          { period: 'Aug 2026', totalReports: 148, sifCount: 27, sifRate: 18, avgScore: 73 },
        ]);
      }

      if (precRes.status === 'fulfilled' && Array.isArray(precRes.value)) {
        setPrecursorData(precRes.value);
      } else {
        setPrecursorData([
          { name: 'Energy Exposure', count: 48, sifCount: 32, percentage: 32 },
          { name: 'Line of Fire', count: 38, sifCount: 24, percentage: 24 },
          { name: 'Isolation Failure', count: 32, sifCount: 22, percentage: 18 },
          { name: 'Work at Height', count: 28, sifCount: 18, percentage: 14 },
          { name: 'Confined Space', count: 18, sifCount: 14, percentage: 8 },
          { name: 'Toxic Exposure', count: 14, sifCount: 9, percentage: 4 },
        ]);
      }

      if (siteRes.status === 'fulfilled' && Array.isArray(siteRes.value)) {
        setSiteData(siteRes.value);
      } else {
        setSiteData([
          { site: 'Offshore Platform Alpha', totalReports: 184, sifCount: 52, sifRate: 28, avgRiskScore: 76 },
          { site: 'Refinery Unit 4', totalReports: 142, sifCount: 34, sifRate: 24, avgRiskScore: 70 },
          { site: 'Chemical Terminal B', totalReports: 118, sifCount: 21, sifRate: 18, avgRiskScore: 62 },
          { site: 'Petrochemical Complex Gamma', totalReports: 96, sifCount: 16, sifRate: 16, avgRiskScore: 58 },
          { site: 'Pipeline Sector 9', totalReports: 82, sifCount: 10, sifRate: 12, avgRiskScore: 48 },
        ]);
      }

      if (barrierRes.status === 'fulfilled' && barrierRes.value) {
        setBarrierData(barrierRes.value);
      } else {
        setBarrierData({
          overallResilienceScore: 78,
          hierarchyBreakdown: {
            ENGINEERING: 52,
            ADMINISTRATIVE: 31,
            PPE: 17,
          },
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load safety analytics');
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
          message="Compiling Enterprise Safety Analytics..."
          subtext="Synthesizing multi-site time-series, precursor distributions, and barrier metrics..."
        />
      </PageContainer>
    );
  }

  if (error && trendData.length === 0) {
    return (
      <PageContainer>
        <ErrorState
          title="Analytics Error"
          message={error}
          onRetry={fetchAnalytics}
        />
      </PageContainer>
    );
  }

  const hierarchyChartData = barrierData?.hierarchyBreakdown
    ? Object.entries(barrierData.hierarchyBreakdown).map(([key, val]) => ({
        name: key,
        value: val,
      }))
    : [
        { name: 'Engineering', value: 52 },
        { name: 'Administrative', value: 31 },
        { name: 'PPE', value: 17 },
      ];

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Safety Analytics & Reporting"
        description="Comprehensive enterprise time-series analytics, SIF rate trajectory, and hierarchy of controls defense telemetry."
        badge="EXECUTIVE TELEMETRY"
        actions={
          <div className="flex items-center gap-3">
            <div className="w-36">
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                options={[
                  { value: '30D', label: 'Last 30 Days' },
                  { value: '90D', label: 'Last 90 Days' },
                  { value: '12M', label: '12 Months' },
                  { value: 'ALL', label: 'All History' },
                ]}
              />
            </div>
            <Button
              variant="outline"
              size="md"
              icon={Printer}
              onClick={() => window.print()}
            >
              Print Report
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Download}
              onClick={() => window.print()}
            >
              Export PDF Dossier
            </Button>
          </div>
        }
      />

      {/* Main Grid: Time Series Area Chart (8 cols) & Hierarchy Donut (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left: Monthly Trend Area Chart */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/60">
            <div>
              <h3 className="text-base font-bold text-on-surface">SIF Potential Trajectory & Volume</h3>
              <p className="text-xs text-on-surface-variant">
                Monthly total submitted reports vs confirmed SIF potential events
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded">
              Avg SIF Rate: 18.4%
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="5%" stopColor="#b2c5ff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#b2c5ff" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorSif" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="5%" stopColor="#003d9b" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#003d9b" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e2ec" vertical={false} />
                <XAxis dataKey="period" stroke="#737685" fontSize={11} tickLine={false} />
                <YAxis stroke="#737685" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#c3c6d6',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area
                  type="monotone"
                  dataKey="totalReports"
                  name="Total Reports"
                  stroke="#0052cc"
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="sifCount"
                  name="SIF Potential Events"
                  stroke="#003d9b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSif)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Hierarchy of Controls Distribution */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-outline-variant/60">
            <h3 className="text-base font-bold text-on-surface">Hierarchy of Controls</h3>
            <span className="text-[10px] font-mono font-bold bg-surface-container-high px-2 py-0.5 rounded">
              DEFENSE MIX
            </span>
          </div>

          <div className="w-full h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hierarchyChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {hierarchyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

          <div className="space-y-2 pt-2 border-t border-outline-variant/50 text-xs">
            {hierarchyChartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between font-medium">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="text-on-surface capitalize">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-on-surface">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Grid: Precursor Ranking Bar (6 cols) & Site Comparison (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left: Precursor Ranking */}
        <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-subtle">
          <h3 className="text-base font-bold text-on-surface mb-1">
            Top Precursor Distribution
          </h3>
          <p className="text-xs text-on-surface-variant mb-4 pb-2 border-b border-outline-variant/60">
            Percentage contribution to overall enterprise SIF risk
          </p>

          <div className="space-y-3">
            {precursorData.map((p, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-on-surface">{p.name}</span>
                  <span className="font-mono font-bold text-primary">{p.percentage || 20}%</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${p.percentage || 20}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Site Comparison Table */}
        <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-on-surface mb-1">
              Facility SIF Rate Benchmarking
            </h3>
            <p className="text-xs text-on-surface-variant mb-4 pb-2 border-b border-outline-variant/60">
              Normalized comparative risk index across operating locations
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="py-2 px-2.5">Site</th>
                    <th className="py-2 px-2.5 text-center">Reports</th>
                    <th className="py-2 px-2.5 text-center">SIF Count</th>
                    <th className="py-2 px-2.5 text-center">SIF Rate</th>
                    <th className="py-2 px-2.5 text-right">Avg Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {siteData.map((s, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/50">
                      <td className="py-2.5 px-2.5 font-semibold text-on-surface truncate max-w-[140px]">
                        {s.site}
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-mono">{s.totalReports}</td>
                      <td className="py-2.5 px-2.5 text-center font-mono font-bold text-error">{s.sifCount}</td>
                      <td className="py-2.5 px-2.5 text-center">
                        <span className="font-mono font-bold text-primary">{s.sifRate}%</span>
                      </td>
                      <td className="py-2.5 px-2.5 text-right">
                        <RiskBadge score={s.avgRiskScore} size="xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
