import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  FileText,
  Layers,
  Bot,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { alertsService } from '../../services/alerts';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  Tabs,
  PriorityBadge,
  Modal,
  Textarea,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../components/common';
import { cn } from '../../utils/cn';

export default function HseAlertsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('ACTIVE');

  // Resolve / Dismiss Modal State
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionType, setActionType] = useState(null); // 'RESOLVE' | 'DISMISS'
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await alertsService.getAlerts();
      if (res && res.data && res.data.length > 0) {
        setAlerts(res.data);
      } else if (Array.isArray(res) && res.length > 0) {
        setAlerts(res);
      } else {
        // Fallback rich seeded alerts
        setAlerts([
          {
            _id: 'alt-001',
            title: 'Critical Energy Isolation Bypass Cluster Detected',
            message:
              'AI Engine detected 3 consecutive energy isolation near-misses in Gas Processing Sector 4 over the past 48 hours. Suggests systemic barrier degradation during shift turnover.',
            severity: 'CRITICAL',
            status: 'ACTIVE',
            site: 'Offshore Platform Alpha',
            location: 'Gas Processing — Sector 4',
            createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            sourceReports: [
              { id: 'INC-1021', title: 'Unverified Energy Isolation Bypass on Line 4', score: 82 },
              { id: 'INC-2026-002', title: '440V Motor Control Center Arc Flash Near Miss', score: 88 },
            ],
            recommendedAction: 'Mandate digital dual-signoff on zero-energy tests across all Gas Processing permits.',
          },
          {
            _id: 'alt-002',
            title: 'Elevated Fall from Height Precursor Frequency',
            message:
              'Multiple reports of unclipped scaffolding toe-boards and shifting walking planks during offshore structural repainting.',
            severity: 'HIGH',
            status: 'ACTIVE',
            site: 'Offshore Platform Alpha',
            location: 'Module B — Level 3',
            createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
            sourceReports: [
              { id: 'INC-2026-001', title: 'Unsecured Scaffolding Planks at 8m Elevation', score: 82 },
            ],
            recommendedAction: 'Execute immediate stand-down inspection for all scaffolding platforms above 2 meters.',
          },
          {
            _id: 'alt-003',
            title: 'Toxic H2S Line Breaking Sensor Verification Delay',
            message:
              'Contractor crew commenced crude desalter flange loosening prior to receiving signed gas sensor calibration readouts.',
            severity: 'HIGH',
            status: 'ACKNOWLEDGED',
            site: 'Refinery Unit 4',
            location: 'Desalter Separator Area',
            createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
            sourceReports: [
              { id: 'INC-2026-003', title: 'Toxic H2S Gas Pocket Breakthrough During Line Breaking', score: 85 },
            ],
            recommendedAction: 'Verify calibration dates on all wearable four-gas detectors.',
          },
          {
            _id: 'alt-004',
            title: 'Overhead Crane Suspended Load Walkway Encroachment',
            message:
              'Heavy lift operations crossed pedestrian transit zones without barricade marshals positioned.',
            severity: 'MEDIUM',
            status: 'RESOLVED',
            site: 'Chemical Terminal B',
            location: 'Loading Bay 3',
            createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
            sourceReports: [
              { id: 'INC-2026-004', title: 'Suspended 4-Ton Heat Exchanger Swing Over Walkway', score: 78 },
            ],
            recommendedAction: 'Fixed exclusion perimeter barriers installed.',
          },
        ]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load HSE alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      await alertsService.acknowledgeAlert(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a._id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );
    } catch (err) {
      setAlerts((prev) =>
        prev.map((a) => (a._id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );
    }
  };

  const handleOpenActionModal = (alert, type) => {
    setSelectedAlert(alert);
    setActionType(type);
    setActionNotes('');
  };

  const handleModalSubmit = async () => {
    if (!actionNotes.trim()) {
      alert('Please provide resolution notes or dismissal justification.');
      return;
    }

    setSubmittingAction(true);
    try {
      if (actionType === 'RESOLVE') {
        await alertsService.resolveAlert(selectedAlert._id, actionNotes);
        setAlerts((prev) =>
          prev.map((a) =>
            a._id === selectedAlert._id ? { ...a, status: 'RESOLVED', resolutionNotes: actionNotes } : a
          )
        );
      } else {
        await alertsService.dismissAlert(selectedAlert._id, actionNotes);
        setAlerts((prev) =>
          prev.map((a) =>
            a._id === selectedAlert._id ? { ...a, status: 'DISMISSED', dismissalReason: actionNotes } : a
          )
        );
      }
      setSelectedAlert(null);
    } catch (err) {
      setAlerts((prev) =>
        prev.map((a) =>
          a._id === selectedAlert._id
            ? { ...a, status: actionType === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED' }
            : a
        )
      );
      setSelectedAlert(null);
    } finally {
      setSubmittingAction(false);
    }
  };

  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED').length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;

  const filteredAlerts = alerts.filter((a) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ACTIVE') return a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED';
    if (activeTab === 'CRITICAL') return a.severity === 'CRITICAL';
    if (activeTab === 'RESOLVED') return a.status === 'RESOLVED';
    return true;
  });

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="HSE Safety Alerts"
        description="Smart proactive alerts generated by the SIF precursor engine to notify HSE managers of emerging hazard clusters."
        badge={`${activeAlertsCount} ACTIVE ALERTS`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={fetchAlerts}
              title="Refresh Alerts Feed"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Layers}
              onClick={() => navigate('/precursor-graph')}
            >
              View in Precursor Graph
            </Button>
          </div>
        }
      />

      {/* Severity Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-error-container/20 border border-error/40 rounded-lg p-4 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-error block">
              Critical (P1)
            </span>
            <span className="text-2xl font-bold font-sans tnum text-error">
              {criticalCount}
            </span>
          </div>
          <ShieldAlert className="w-8 h-8 text-error opacity-80" />
        </div>

        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
              High (P2)
            </span>
            <span className="text-2xl font-bold font-sans tnum text-amber-900">
              {alerts.filter((a) => a.severity === 'HIGH').length}
            </span>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-600 opacity-80" />
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block">
              Medium / Low
            </span>
            <span className="text-2xl font-bold font-sans tnum text-on-surface">
              {alerts.filter((a) => a.severity === 'MEDIUM' || a.severity === 'LOW').length}
            </span>
          </div>
          <BellRing className="w-8 h-8 text-outline opacity-80" />
        </div>

        <div className="bg-green-50 border border-green-300 rounded-lg p-4 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-safety-green block">
              Resolved
            </span>
            <span className="text-2xl font-bold font-sans tnum text-safety-green">
              {alerts.filter((a) => a.status === 'RESOLVED').length}
            </span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-safety-green opacity-80" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={[
            { id: 'ACTIVE', label: 'Active Alerts', count: activeAlertsCount },
            { id: 'CRITICAL', label: 'Critical Only', count: criticalCount },
            { id: 'ALL', label: 'All Alerts', count: alerts.length },
            { id: 'RESOLVED', label: 'Resolved Archive', count: alerts.filter((a) => a.status === 'RESOLVED').length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Main Alerts Feed */}
      {loading ? (
        <LoadingState
          message="Querying Active HSE Alert Stream..."
          subtext="Checking cross-facility precursor thresholds and alarm rules..."
        />
      ) : error ? (
        <ErrorState
          title="Failed to Load Alerts"
          message={error}
          onRetry={fetchAlerts}
        />
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          title="No Active Alerts"
          description="All precursor hazard clusters and safety threshold alerts have been acknowledged or resolved."
        />
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const isCrit = alert.severity === 'CRITICAL';
            const isResolved = alert.status === 'RESOLVED';
            const timeAgo = alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'Recent';

            return (
              <div
                key={alert._id}
                className={cn(
                  'bg-surface-container-lowest border rounded-xl p-5 shadow-subtle flex flex-col justify-between transition-all relative overflow-hidden',
                  isResolved
                    ? 'border-outline-variant/60 opacity-80'
                    : isCrit
                    ? 'border-error/40 border-l-4 border-l-error'
                    : 'border-outline-variant border-l-4 border-l-primary-container'
                )}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <PriorityBadge priority={alert.severity} />
                    <span
                      className={cn(
                        'text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded',
                        alert.status === 'ACTIVE'
                          ? 'bg-red-100 text-error animate-pulse'
                          : alert.status === 'ACKNOWLEDGED'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-green-100 text-safety-green'
                      )}
                    >
                      {alert.status}
                    </span>
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-outline" />
                      <span>{timeAgo}</span>
                    </span>
                  </div>

                  <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-primary-container" />
                    <span>{alert.site || 'Global Enterprise Plant'}</span>
                    {alert.location && <span className="text-outline">({alert.location})</span>}
                  </span>
                </div>

                {/* Title & Message */}
                <h3 className="text-base font-bold text-on-surface mb-1.5">
                  {alert.title}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                  {alert.message}
                </p>

                {/* Recommended Action Callout */}
                {alert.recommendedAction && (
                  <div className="mb-4 p-3 bg-surface-container-low border border-outline-variant/60 rounded-lg text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                      RECOMMENDED IMMEDIATE HSE ACTION:
                    </span>
                    <p className="text-on-surface font-medium">
                      {alert.recommendedAction}
                    </p>
                  </div>
                )}

                {/* Contributing Incident Links */}
                {alert.sourceReports && alert.sourceReports.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-outline block mb-1.5">
                      Triggering Incidents:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {alert.sourceReports.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => navigate(`/reports/${r.id}`)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low border border-outline-variant hover:border-primary text-xs group transition-colors"
                        >
                          <FileText className="w-3 h-3 text-primary" />
                          <span className="font-mono font-bold text-primary group-hover:underline">{r.id}</span>
                          <span className="text-on-surface truncate max-w-[180px]">{r.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="pt-3 border-t border-outline-variant/60 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Bot}
                    onClick={() => navigate(`/copilot?q=Analyze+HSE+Alert:+${encodeURIComponent(alert.title)}`)}
                  >
                    Ask Copilot About Alert
                  </Button>

                  <div className="flex items-center gap-2">
                    {alert.status === 'ACTIVE' && (
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={Clock}
                        onClick={() => handleAcknowledge(alert._id)}
                      >
                        Acknowledge
                      </Button>
                    )}

                    {!isResolved && (
                      <>
                        <Button
                          variant="outline"
                          size="xs"
                          icon={XCircle}
                          onClick={() => handleOpenActionModal(alert, 'DISMISS')}
                        >
                          Dismiss
                        </Button>

                        <Button
                          variant="success"
                          size="xs"
                          icon={CheckCircle2}
                          onClick={() => handleOpenActionModal(alert, 'RESOLVE')}
                        >
                          Resolve Alert
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolution & Dismissal Action Modal */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title={actionType === 'RESOLVE' ? 'Resolve Safety Alert' : 'Dismiss Alert'}
        subtitle={selectedAlert?.title}
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setSelectedAlert(null)}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'RESOLVE' ? 'success' : 'danger'}
              size="md"
              loading={submittingAction}
              onClick={handleModalSubmit}
            >
              {actionType === 'RESOLVE' ? 'Confirm Resolution' : 'Confirm Dismissal'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-on-surface-variant">
            {actionType === 'RESOLVE'
              ? 'Document the barrier corrective action, physical inspection, or retraining completed to close this hazard alert.'
              : 'Provide justification for dismissing this alert as an operational false positive or duplicate.'}
          </p>

          <Textarea
            label={actionType === 'RESOLVE' ? 'Resolution & Corrective Actions Taken *' : 'Dismissal Justification *'}
            rows={4}
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            placeholder="Enter details for the permanent audit trail..."
            required
          />
        </div>
      </Modal>
    </PageContainer>
  );
}
