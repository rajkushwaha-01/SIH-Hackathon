import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Sparkles,
  AlertTriangle,
  Flame,
  Wrench,
  MapPin,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  SlidersHorizontal,
  Bot,
  Layers,
  FileText,
  Clock,
} from 'lucide-react';
import { patternsService } from '../../services/patterns';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  Tabs,
  RiskBadge,
  PriorityBadge,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../components/common';
import { cn } from '../../utils/cn';

export default function RecurringPatternsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchPatterns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patternsService.getPatterns();
      const patternsList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : (res?.patterns || []);
      setPatterns(patternsList);
    } catch (err) {
      console.error('Failed to load recurring patterns from database:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load recurring patterns from database');
      setPatterns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const handleRunMiningJob = async () => {
    setDetecting(true);
    try {
      await patternsService.detectPatterns();
      await fetchPatterns();
    } catch (err) {
      console.error('Pattern detection failed:', err);
      setError(err?.response?.data?.message || err?.message || 'Pattern detection failed');
    } finally {
      setDetecting(false);
    }
  };

  const handleUpdateStatus = async (patternId, newStatus) => {
    try {
      await patternsService.updateStatus(patternId, newStatus);
      setPatterns((prev) =>
        prev.map((p) => (p._id === patternId ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      setPatterns((prev) =>
        prev.map((p) => (p._id === patternId ? { ...p, status: newStatus } : p))
      );
    }
  };

  const filteredPatterns = patterns.filter((p) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'CRITICAL') return p.riskLevel === 'CRITICAL';
    if (activeTab === 'ACTIVE') return p.status === 'ACTIVE';
    if (activeTab === 'UNDER_REVIEW') return p.status === 'UNDER_REVIEW';
    return true;
  });

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Recurring Safety Patterns"
        description="AI Pattern Mining: Detect multi-shift clusters where activities, locations, hazards, and barrier failures converge repeatedly."
        badge={`${patterns.length} ACTIVE CLUSTERS`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={fetchPatterns}
              title="Refresh Clusters"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Sparkles}
              loading={detecting}
              onClick={handleRunMiningJob}
              className="shadow-sm font-bold"
            >
              Run Pattern Mining Job
            </Button>
          </div>
        }
      />

      {/* Tabs Filter Ribbon */}
      <div className="mb-6">
        <Tabs
          tabs={[
            { id: 'ALL', label: 'All Patterns', count: patterns.length },
            { id: 'ACTIVE', label: 'Active Clusters', count: patterns.filter((p) => p.status === 'ACTIVE').length },
            { id: 'CRITICAL', label: 'Critical Severity', count: patterns.filter((p) => p.riskLevel === 'CRITICAL').length },
            { id: 'UNDER_REVIEW', label: 'Under Review', count: patterns.filter((p) => p.status === 'UNDER_REVIEW').length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Main Pattern Cluster Feed */}
      {loading ? (
        <LoadingState
          message="Mining Recurring Safety Clusters..."
          subtext="Executing FP-Growth association rules across multi-site incident telemetry..."
        />
      ) : error ? (
        <ErrorState
          title="Pattern Mining Error"
          message={error}
          onRetry={fetchPatterns}
        />
      ) : filteredPatterns.length === 0 ? (
        <EmptyState
          title="No Patterns Found"
          description="There are no recurring safety clusters matching your selected tab filter."
          actionLabel="Run Pattern Mining Engine"
          onAction={handleRunMiningJob}
        />
      ) : (
        <div className="space-y-6">
          {filteredPatterns.map((pattern) => {
            const isCrit = pattern.riskLevel === 'CRITICAL';
            return (
              <div
                key={pattern._id}
                className={cn(
                  'bg-surface-container-lowest border rounded-xl p-6 shadow-subtle flex flex-col justify-between transition-all relative overflow-hidden',
                  isCrit
                    ? 'border-error/40 border-l-4 border-l-error'
                    : 'border-outline-variant border-l-4 border-l-primary-container'
                )}
              >
                {/* Top Cluster Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-outline-variant/60">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                        isCrit ? 'bg-error-container text-error' : 'bg-primary-fixed text-primary'
                      )}
                    >
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <RiskBadge level={pattern.riskLevel} size="xs" />
                        <span
                          className={cn(
                            'text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded',
                            pattern.status === 'ACTIVE'
                              ? 'bg-red-100 text-error'
                              : 'bg-amber-100 text-amber-900'
                          )}
                        >
                          {pattern.status.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] font-mono text-outline">
                          {Math.round((pattern.confidence || 0.9) * 100)}% Confidence
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-on-surface">
                        {pattern.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-surface-container-high text-on-surface">
                      {pattern.reportCount} Reports Aggregated
                    </span>
                  </div>
                </div>

                {/* Narrative Summary */}
                <p className="text-sm text-on-surface leading-relaxed mb-5">
                  {pattern.description}
                </p>

                {/* 4 Convergence Breakdown Cards */}
                {pattern.elements && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    {/* Activity */}
                    <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/60 text-xs">
                      <span className="text-[10px] uppercase font-bold text-outline block mb-1 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-primary-container" />
                        <span>Activity</span>
                      </span>
                      <span className="font-semibold text-on-surface block truncate">
                        {pattern.elements.activity}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/60 text-xs">
                      <span className="text-[10px] uppercase font-bold text-outline block mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary-container" />
                        <span>Location</span>
                      </span>
                      <span className="font-semibold text-on-surface block truncate">
                        {pattern.elements.location}
                      </span>
                    </div>

                    {/* Hazard */}
                    <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/60 text-xs">
                      <span className="text-[10px] uppercase font-bold text-outline block mb-1 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-error" />
                        <span>Primary Hazard</span>
                      </span>
                      <span className="font-semibold text-on-surface block truncate">
                        {pattern.elements.hazard}
                      </span>
                    </div>

                    {/* Degraded Barrier */}
                    <div className="p-3 bg-error-container/15 rounded-lg border border-error/30 text-xs">
                      <span className="text-[10px] uppercase font-bold text-error block mb-1 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-error" />
                        <span>Degrading Barrier</span>
                      </span>
                      <span className="font-bold text-error block truncate">
                        {pattern.elements.barrier}
                      </span>
                    </div>
                  </div>
                )}

                {/* Linked Incident Reports */}
                {pattern.reports && pattern.reports.length > 0 && (
                  <div className="mb-5">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                      Contributing Incident Evidence:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {pattern.reports.map((rep) => (
                        <div
                          key={rep.id}
                          onClick={() => navigate(`/reports/${rep.id}`)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant hover:border-primary transition-all cursor-pointer text-xs group"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <span className="font-mono font-bold text-primary group-hover:underline">
                            {rep.id}
                          </span>
                          <span className="text-on-surface font-medium truncate max-w-[220px]">
                            {rep.title}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-error bg-error-container/30 px-1 rounded">
                            {rep.score} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="pt-4 border-t border-outline-variant/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={SlidersHorizontal}
                      onClick={() => navigate(`/risk-simulator?reportId=${pattern.reports?.[0]?.id || 'INC-1021'}`)}
                    >
                      Simulate Controls in What-If
                    </Button>
                    <Button
                      variant="accent"
                      size="sm"
                      icon={Bot}
                      onClick={() => navigate(`/copilot?q=Analyze+recurring+pattern+${encodeURIComponent(pattern.title)}`)}
                    >
                      Ask Copilot
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {pattern.status === 'ACTIVE' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Clock}
                        onClick={() => handleUpdateStatus(pattern._id, 'UNDER_REVIEW')}
                      >
                        Mark Under Review
                      </Button>
                    )}
                    {pattern.status === 'UNDER_REVIEW' && (
                      <Button
                        variant="success"
                        size="sm"
                        icon={CheckCircle2}
                        onClick={() => handleUpdateStatus(pattern._id, 'MITIGATED')}
                      >
                        Mark Mitigated
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
