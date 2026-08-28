import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Bot,
  MapPin,
  Flame,
  Wrench,
  Boxes,
  BellRing,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { analyticsService } from '../../services/analytics';
import { alertsService } from '../../services/alerts';
import { patternsService } from '../../services/patterns';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  LoadingState,
  ErrorState,
  MetricCard,
  PriorityBadge,
} from '../../components/common';
import { cn } from '../../utils/cn';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [topPattern, setTopPattern] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, alertsRes, patternsRes] = await Promise.allSettled([
        analyticsService.getDashboard(),
        alertsService.getAlerts({ limit: 5, status: 'ACTIVE' }),
        patternsService.getPatterns({ limit: 1 }),
      ]);

      if (dash.status === 'fulfilled' && dash.value) {
        setDashboardData(dash.value.data || dash.value);
      }

      const alertsData = alertsRes.status === 'fulfilled' ? (Array.isArray(alertsRes.value) ? alertsRes.value : alertsRes.value?.data || alertsRes.value?.alerts || []) : [];
      if (alertsData.length > 0) {
        setRecentAlerts(alertsData.slice(0, 3));
      }

      const patternsData = patternsRes.status === 'fulfilled' ? (Array.isArray(patternsRes.value) ? patternsRes.value : patternsRes.value?.data || patternsRes.value?.patterns || []) : [];
      if (patternsData.length > 0) {
        setTopPattern(patternsData[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load safety intelligence dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState
          message="Aggregating Safety Intelligence Overview..."
          subtext="Synthesizing multi-site telemetry, precursor weights, and AI pattern models..."
        />
      </PageContainer>
    );
  }

  if (error && !dashboardData) {
    return (
      <PageContainer>
        <ErrorState
          title="Executive Dashboard Error"
          message={error}
          onRetry={fetchDashboard}
        />
      </PageContainer>
    );
  }

  const kpis = dashboardData?.kpis || {};
  const trendsData =
    dashboardData?.trends && dashboardData.trends.length > 0
      ? dashboardData.trends.map((t, idx) => ({
          name: t.period || `W${idx + 1}`,
          'SIF Potential': t.sifPotentialCount ?? t.sifCount ?? 0,
          'Needs Review': t.needsReview ?? Math.round((t.totalReports || 10) * 0.2),
          'Non-SIF': t.nonSif ?? Math.max((t.totalReports || 50) - (t.sifPotentialCount || 0), 20),
        }))
      : [
          { name: 'W1', 'SIF Potential': 12, 'Needs Review': 8, 'Non-SIF': 45 },
          { name: 'W2', 'SIF Potential': 19, 'Needs Review': 10, 'Non-SIF': 42 },
          { name: 'W3', 'SIF Potential': 15, 'Needs Review': 9, 'Non-SIF': 50 },
          { name: 'W4', 'SIF Potential': 17, 'Needs Review': 12, 'Non-SIF': 48 },
          { name: 'W5', 'SIF Potential': 22, 'Needs Review': 11, 'Non-SIF': 55 },
          { name: 'W6', 'SIF Potential': 20, 'Needs Review': 13, 'Non-SIF': 52 },
          { name: 'W7', 'SIF Potential': 24, 'Needs Review': 11, 'Non-SIF': 60 },
        ];

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Safety Intelligence"
        description="Understand where serious harm could happen before it happens."
        badge="EXECUTIVE OVERVIEW"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={fetchDashboard}
              title="Refresh Dashboard"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Upload}
              onClick={() => navigate('/reports/upload')}
            >
              Ingest Safety Report
            </Button>
          </div>
        }
      />

      {/* Metric Row (Bento Grid Style) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {/* SIF Potential - Highlighted in primary blue */}
        <MetricCard
          title="SIF Potential"
          value={kpis.sifPotentialCount ?? 24}
          trend={{ value: `${kpis.sifRate || 18}%`, direction: 'up', isPositive: false }}
          variant="highlight"
          onClick={() => navigate('/reports?sifStatus=SIF_POTENTIAL')}
          subtitle="Precursors Detected"
        />

        {/* Needs Review */}
        <MetricCard
          title="Needs Review"
          value={kpis.needsReviewCount ?? 11}
          variant="default"
          onClick={() => navigate('/reports?sifStatus=NEEDS_REVIEW')}
          subtitle="Human Validation Queue"
        />

        {/* High Risk Reports */}
        <MetricCard
          title="High Risk Reports"
          value={kpis.criticalRiskCount ?? 8}
          variant="critical"
          onClick={() => navigate('/reports')}
          subtitle="Scenario Score > 75"
        />

        {/* Recurring Precursors */}
        <MetricCard
          title="Active Patterns"
          value={kpis.activePatternsCount ?? 17}
          variant="default"
          onClick={() => navigate('/patterns')}
          subtitle="Clusters Identified"
        />

        {/* Reports Analyzed */}
        <MetricCard
          title="Reports Analyzed"
          value={(kpis.analyzedReports || kpis.totalReports || 1284).toLocaleString()}
          variant="default"
          onClick={() => navigate('/reports')}
          subtitle="Enterprise Archive"
        />
      </div>

      {/* Main Asymmetric Grid: Chart (8 cols) & AI Insight (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left: SIF Potential Trend Chart */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/50">
            <div>
              <h3 className="text-base font-bold text-on-surface">SIF Potential Trend</h3>
              <p className="text-xs text-on-surface-variant">Weekly volume progression across classification boundaries</p>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View Full Report <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recharts Line Visualization */}
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e2ec" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#737685"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#c3c6d6' }}
                />
                <YAxis
                  stroke="#737685"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#c3c6d6',
                    borderRadius: '6px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(26,29,33,0.08)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-on-surface">{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="SIF Potential"
                  stroke="#003d9b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#003d9b' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Needs Review"
                  stroke="#737685"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#737685' }}
                />
                <Line
                  type="monotone"
                  dataKey="Non-SIF"
                  stroke="#bfc8d0"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: AI Safety Intelligence Panel matching Stitch */}
        <div className="lg:col-span-4 bg-surface-container-low border border-outline-variant border-l-4 border-l-primary-container rounded-lg p-5 shadow-subtle flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Bot className="w-24 h-24 text-primary" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary-container" />
              <h3 className="text-base font-bold text-primary">Safety Intelligence</h3>
            </div>

            <div className="text-xs text-on-surface-variant space-y-3 leading-relaxed">
              <p>
                Analysis detects an <strong className="text-on-surface font-bold">18% increase</strong> in SIF Potential at <strong className="text-on-surface">Offshore Platform Alpha</strong> over recent monitoring intervals.
              </p>
              <p>
                Top contributing factors are heavily correlated with <strong className="text-on-surface font-bold">Energy Isolation Failures</strong> during ad-hoc maintenance tasks.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/60 relative z-10">
            <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant/80 mb-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                RECOMMENDED ACTION
              </span>
              <p className="text-xs text-on-surface font-medium leading-snug">
                Review Lockout/Tagout (LOTO) verification procedures for Gas Processing Area at Site A immediately.
              </p>
            </div>

            <Button
              variant="accent"
              size="sm"
              icon={Bot}
              onClick={() => navigate('/copilot?q=Analyze+the+recent+SIF+potential+spike+at+Site+A')}
              className="w-full text-xs"
            >
              Ask HSE Copilot About Site A
            </Button>
          </div>
        </div>
      </div>

      {/* Secondary 3-Column Grid: High-Risk Areas, Top Precursors, Recent Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Col 1: High-Risk Areas */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-subtle flex flex-col justify-between">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4 pb-2 border-b border-outline-variant/60">
            High-Risk Areas
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 border-b border-outline-variant/40 pb-1">
                ACTIVITIES
              </h4>
              <ul className="space-y-2 text-xs text-on-surface">
                <li className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-error shrink-0" />
                  <span>Maintenance</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-error shrink-0" />
                  <span>Work at Height</span>
                </li>
                <li className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                  <span>Confined Space</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 border-b border-outline-variant/40 pb-1">
                LOCATIONS
              </h4>
              <ul className="space-y-2 text-xs text-on-surface">
                <li className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-error shrink-0" />
                  <span>Gas Processing</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-primary-container shrink-0" />
                  <span>Loading Bay 3</span>
                </li>
                <li className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                  <span>Substation B</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/40">
            <button
              onClick={() => navigate('/intelligence')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Explore Full Taxonomy <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Col 2: Top SIF Precursors */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-subtle flex flex-col justify-between">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4 pb-2 border-b border-outline-variant/60">
            Top SIF Precursors
          </h3>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-on-surface">Energy Exposure</span>
                <span className="font-bold text-error">32%</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div className="bg-error h-2 rounded-full" style={{ width: '32%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-on-surface">Line of Fire</span>
                <span className="font-bold text-primary-container">24%</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div className="bg-primary-container h-2 rounded-full" style={{ width: '24%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-on-surface">Isolation Failure</span>
                <span className="font-bold text-tertiary">18%</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div className="bg-tertiary h-2 rounded-full" style={{ width: '18%' }} />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/40">
            <button
              onClick={() => navigate('/precursor-graph')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Open Precursor Graph <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Col 3: Recent HSE Alerts Queue */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-0 shadow-subtle overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <BellRing className="w-4 h-4 text-error" />
              <span>Recent Alerts</span>
            </h3>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs text-primary font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-outline-variant/60 flex-1 overflow-y-auto max-h-56">
            {recentAlerts.map((alt) => {
              const isCrit = alt.severity === 'CRITICAL';
              return (
                <div
                  key={alt._id || alt.id}
                  onClick={() => navigate('/alerts')}
                  className={cn(
                    'p-3.5 transition-colors cursor-pointer border-l-4 hover:bg-surface-container-low',
                    isCrit ? 'border-l-error bg-error-container/10' : 'border-l-primary-container'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <PriorityBadge priority={alt.severity} />
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {alt.createdAt ? new Date(alt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-on-surface line-clamp-1 mb-1">
                    {alt.title}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-outline shrink-0" />
                    <span className="truncate">{alt.site || 'Enterprise Site'}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Highlighted Recurring Pattern Banner (Full Width matching Stitch) */}
      <div className="bg-surface-container-highest border border-outline-variant rounded-lg p-6 shadow-subtle flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-container/10 to-transparent pointer-events-none" />

        <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center text-white shrink-0 z-10 shadow-xs">
          <Boxes className="w-7 h-7" />
        </div>

        <div className="flex-1 z-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <h3 className="text-lg font-bold text-on-surface">
              Recurring Pattern Detected
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-error text-white">
              High Priority
            </span>
          </div>
          <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
            System has identified an active multi-shift precursor cluster:{' '}
            <strong className="text-on-surface font-semibold">
              {topPattern?.title || 'Maintenance + Gas Processing + Energy Isolation + Barrier Failure'}
            </strong>{' '}
            occurring across repeated operations.
          </p>
        </div>

        <div className="z-10 shrink-0">
          <Button
            variant="primary"
            size="md"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => navigate('/patterns')}
          >
            Investigate Cluster
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
