import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  ShieldCheck,
  Search,
  Download,
  Filter,
  Bot,
  User,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  Input,
  Select,
  Badge,
  Pagination,
  LoadingState,
  EmptyState,
} from '../../components/common';
import { cn } from '../../utils/cn';

const INITIAL_AUDIT_LOGS = [
  {
    id: 'AUD-2026-9901',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    action: 'HUMAN_REVIEW_APPROVED',
    entityId: 'INC-1021',
    entityType: 'REPORT',
    actor: 'Raj Sharma',
    role: 'HSE_OFFICER',
    previousState: 'SIF_POTENTIAL (82 pts)',
    newState: 'APPROVED_SIF (82 pts)',
    notes: 'Confirmed LOTO bypass with secondary hydraulic pressure risk. Mandatory retraining ordered.',
  },
  {
    id: 'AUD-2026-9902',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    action: 'ALERT_RESOLVED',
    entityId: 'ALT-004',
    entityType: 'ALERT',
    actor: 'Raj Sharma',
    role: 'HSE_OFFICER',
    previousState: 'ACTIVE',
    newState: 'RESOLVED',
    notes: 'Fixed physical exclusion perimeter barriers installed at Chemical Terminal B loading bay.',
  },
  {
    id: 'AUD-2026-9903',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    action: 'AI_CLASSIFICATION',
    entityId: 'INC-2026-003',
    entityType: 'REPORT',
    actor: 'AI_ENGINE',
    role: 'SYSTEM',
    previousState: 'UNPROCESSED',
    newState: 'SIF_POTENTIAL (85 pts)',
    notes: 'Grounded against IOGP-LSR-04 (Energy Isolation) with 94% model confidence.',
  },
  {
    id: 'AUD-2026-9904',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    action: 'SIMULATION_SAVED',
    entityId: 'SIM-0881',
    entityType: 'SIMULATION',
    actor: 'Raj Sharma',
    role: 'HSE_OFFICER',
    previousState: 'Baseline: 82 pts',
    newState: 'Simulated: 28 pts (-66%)',
    notes: 'Evaluated Keyed Interlocks and Digital Dual LOTO signoff controls.',
  },
  {
    id: 'AUD-2026-9905',
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    action: 'PATTERN_MINED',
    entityId: 'PAT-001',
    entityType: 'PATTERN',
    actor: 'AI_ENGINE',
    role: 'SYSTEM',
    previousState: 'N/A',
    newState: 'CLUSTER_DETECTED',
    notes: 'Mined 14-report cluster on Gas Processing pump maintenance across night shifts.',
  },
  {
    id: 'AUD-2026-9906',
    timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    action: 'HUMAN_OVERRIDE',
    entityId: 'INC-2026-006',
    entityType: 'REPORT',
    actor: 'Raj Sharma',
    role: 'HSE_OFFICER',
    previousState: 'NEEDS_REVIEW (54 pts)',
    newState: 'MODIFIED_SCORE (68 pts)',
    notes: 'Adjusted score upward due to heavy rainfall exacerbating trench collapse risk.',
  },
  {
    id: 'AUD-2026-9907',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    action: 'REPORT_INGESTED',
    entityId: 'INC-2026-001',
    entityType: 'REPORT',
    actor: 'Marcus Vance',
    role: 'OPERATIONS',
    previousState: 'N/A',
    newState: 'INGESTED',
    notes: 'Uploaded PDF incident report from Offshore Platform Alpha.',
  },
];

export default function AuditTrailPage() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedActor, setSelectedActor] = useState('ALL');
  const [logs, setLogs] = useState(INITIAL_AUDIT_LOGS);
  const [page, setPage] = useState(1);

  const filteredLogs = logs.filter((log) => {
    if (selectedAction !== 'ALL' && log.action !== selectedAction) return false;
    if (selectedActor !== 'ALL') {
      if (selectedActor === 'AI' && log.actor !== 'AI_ENGINE') return false;
      if (selectedActor === 'HUMAN' && log.actor === 'AI_ENGINE') return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.id.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.notes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getActionBadge = (action) => {
    if (action.includes('APPROVED')) {
      return <Badge variant="success">APPROVED</Badge>;
    }
    if (action.includes('OVERRIDE') || action.includes('MODIFIED')) {
      return <Badge variant="warning">OVERRIDE</Badge>;
    }
    if (action.includes('AI')) {
      return <Badge variant="primary">AI CLASSIFY</Badge>;
    }
    if (action.includes('RESOLVED')) {
      return <Badge variant="success">RESOLVED</Badge>;
    }
    if (action.includes('SIMULATION')) {
      return <Badge variant="accent">SIMULATION</Badge>;
    }
    return <Badge variant="default">{action}</Badge>;
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Audit Trail & Compliance"
        description="Immutable, tamper-evident ledger tracking all AI precursor classifications, human validations, and risk recalibrations."
        badge="COMPLIANCE RECORD"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              icon={Download}
              onClick={() => window.print()}
            >
              Export Audit CSV
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={ShieldCheck}
              onClick={() => window.print()}
            >
              Generate Certificate
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-subtle mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by Audit ID, Report ID, actor, or notes..."
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="w-full md:w-52">
          <Select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Action Types' },
              { value: 'HUMAN_REVIEW_APPROVED', label: 'Human Review Approved' },
              { value: 'HUMAN_OVERRIDE', label: 'Human Override' },
              { value: 'AI_CLASSIFICATION', label: 'AI Classification' },
              { value: 'ALERT_RESOLVED', label: 'Alert Resolved' },
              { value: 'SIMULATION_SAVED', label: 'Simulation Saved' },
              { value: 'REPORT_INGESTED', label: 'Report Ingested' },
            ]}
          />
        </div>

        <div className="w-full md:w-44">
          <Select
            value={selectedActor}
            onChange={(e) => setSelectedActor(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Actors' },
              { value: 'HUMAN', label: 'HSE Officers' },
              { value: 'AI', label: 'AI Engine' },
            ]}
          />
        </div>
      </div>

      {/* Main Audit Data Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="py-3 px-4">Audit ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Entity Ref</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">State Transition</th>
                <th className="py-3 px-4">Reviewer Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {filteredLogs.map((log) => {
                const isAI = log.actor === 'AI_ENGINE';
                return (
                  <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors">
                    {/* Audit ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-primary whitespace-nowrap">
                      {log.id}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-on-surface-variant whitespace-nowrap">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-outline" />
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Entity ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (log.entityType === 'REPORT') navigate(`/reports/${log.entityId}`);
                          if (log.entityType === 'ALERT') navigate('/alerts');
                          if (log.entityType === 'SIMULATION') navigate('/risk-simulator');
                          if (log.entityType === 'PATTERN') navigate('/patterns');
                        }}
                        className="font-mono font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{log.entityId}</span>
                      </button>
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-on-surface">
                        {isAI ? (
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-safety-green" />
                        )}
                        <span>{log.actor}</span>
                        <span className="text-[10px] text-outline font-mono">({log.role})</span>
                      </div>
                    </td>

                    {/* State Transition */}
                    <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                      <span className="text-outline">{log.previousState}</span>
                      <span className="text-primary font-bold mx-1.5">➔</span>
                      <span className="text-on-surface font-bold">{log.newState}</span>
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 text-on-surface-variant max-w-xs truncate" title={log.notes}>
                      {log.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <Pagination
          currentPage={1}
          totalPages={1}
          totalItems={filteredLogs.length}
          itemsPerPage={10}
          onPageChange={() => {}}
        />
      </div>
    </PageContainer>
  );
}
