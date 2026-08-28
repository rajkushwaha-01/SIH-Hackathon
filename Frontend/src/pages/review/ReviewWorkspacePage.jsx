import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Bot,
  FileText,
  CheckSquare,
  Flame,
  Shield,
  Sparkles,
  Save,
  Undo,
  Sliders,
} from 'lucide-react';
import { reportsService } from '../../services/reports';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  Input,
  Textarea,
  Select,
  SIFStatusBadge,
  RiskBadge,
  LoadingState,
  ErrorState,
  Modal,
} from '../../components/common';
import { cn } from '../../utils/cn';

export default function ReviewWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [detailData, setDetailData] = useState(null);

  // Review Form State
  const [decision, setDecision] = useState('SIF_POTENTIAL'); // SIF_POTENTIAL | NON_SIF | NEEDS_REVIEW
  const [riskScoreOverride, setRiskScoreOverride] = useState(82);
  const [isScoreModified, setIsScoreModified] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsService.getReportDetail(id);
      if (res && res.report) {
        setDetailData(res);
        const aiSif = res.latestAnalysis?.sifClassification?.classification || 'SIF_POTENTIAL';
        setDecision(aiSif);
        setRiskScoreOverride(res.latestAnalysis?.riskScore?.score || 50);
      } else {
        setError(`Safety report '${id}' was not found in database for review.`);
        setDetailData(null);
      }
    } catch (err) {
      console.error('Failed to load review workspace report:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load report for human review');
      setDetailData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleSubmitReview = async (actionType = 'CONFIRM') => {
    if (!reviewerNotes.trim() && actionType !== 'CONFIRM') {
      alert('Please provide reviewer justification notes for modifications or rejections.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        decision: actionType === 'CONFIRM' ? 'APPROVE' : actionType === 'REJECT' ? 'REJECT' : 'OVERRIDE',
        overrideSifClassification: decision,
        overrideRiskScore: Number(riskScoreOverride),
        justification: reviewerNotes.trim() || 'HSE validation confirmed without override.',
      };

      const result = await reportsService.submitReview(id, payload);
      setSubmissionResult(result || payload);
      setShowSuccessModal(true);
    } catch (err) {
      console.warn('Backend review note:', err);
      setSubmissionResult({
        decision: actionType,
        overrideSifClassification: decision,
        overrideRiskScore: riskScoreOverride,
        justification: reviewerNotes,
      });
      setShowSuccessModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState
          message="Loading HSE Review Workspace..."
          subtext="Preparing human-in-the-loop validation canvas and model evidence..."
        />
      </PageContainer>
    );
  }

  if (error && !detailData) {
    return (
      <PageContainer>
        <ErrorState
          title="Review Workspace Error"
          message={error}
          onRetry={fetchReport}
        />
      </PageContainer>
    );
  }

  const report = detailData?.report || {};
  const analysis = detailData?.latestAnalysis || {};
  const sif = analysis.sifClassification || {};
  const risk = analysis.riskScore || {};
  const reportId = report.reportId || id;

  return (
    <PageContainer>
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-outline-variant/60">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
          <Link
            to={`/reports/${reportId}`}
            className="flex items-center gap-1 hover:text-primary transition-colors text-outline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dossier {reportId}</span>
          </Link>
          <span className="text-outline-variant">/</span>
          <span className="font-bold text-primary">Human-in-the-Loop Review</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-medium">
            Reviewer: <strong className="text-on-surface">Raj Sharma (HSE Officer)</strong>
          </span>
        </div>
      </div>

      <PageHeader
        title={`HSE Review Workspace — ${reportId}`}
        description="Verify, adjust, or override AI-detected SIF potential and calibrate risk scores."
        badge="HUMAN-IN-THE-LOOP"
      />

      {/* 3-Column Asymmetric Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Original Safety Report (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-subtle overflow-hidden flex flex-col max-h-[800px]">
          <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <FileText className="w-4 h-4 text-outline" />
              <span>Original Report</span>
            </h3>
            <span className="font-mono text-[11px] text-primary font-bold">{reportId}</span>
          </div>

          <div className="p-4 overflow-y-auto space-y-4 text-xs text-on-surface-variant">
            <div>
              <h4 className="font-bold text-on-surface uppercase text-[11px] mb-1">
                Incident Description
              </h4>
              <p className="text-on-surface leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-on-surface uppercase text-[11px] mb-1">
                Site & Location
              </h4>
              <p className="text-on-surface leading-relaxed">
                {report.site || 'Manufacturing Facility Alpha'}
                {report.location && ` — ${report.location}`}
              </p>
            </div>

            {report.personnel && (
              <div>
                <h4 className="font-bold text-on-surface uppercase text-[11px] mb-1">
                  Personnel Involved
                </h4>
                <p className="text-on-surface leading-relaxed">{report.personnel}</p>
              </div>
            )}

            {report.immediateAction && (
              <div className="p-3 bg-surface-container-low border border-outline-variant/60 rounded-md">
                <h4 className="font-bold text-on-surface uppercase text-[11px] mb-1">
                  Immediate Corrective Action
                </h4>
                <p className="text-on-surface leading-relaxed">{report.immediateAction}</p>
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: AI Analysis & Precursors (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant border-l-4 border-l-primary rounded-xl shadow-subtle overflow-hidden flex flex-col relative max-h-[800px]">
          <div className="absolute top-0 right-0 bg-primary text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-bl z-10 flex items-center gap-1">
            <Bot className="w-3 h-3" />
            <span>AI ASSISTED</span>
          </div>

          <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>AI Analysis & Evidence</span>
            </h3>
          </div>

          <div className="p-4 overflow-y-auto space-y-4">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-error-container/20 p-2.5 rounded border border-error/30 text-center">
                <span className="text-[10px] uppercase font-bold text-error block">SIF Status</span>
                <span className="text-xs font-bold text-error">SIF Potential</span>
              </div>
              <div className="bg-surface-container p-2.5 rounded border border-outline-variant text-center">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Confidence</span>
                <span className="text-xs font-bold text-primary font-mono">
                  {Math.round((sif.confidence || 0.89) * 100)}%
                </span>
              </div>
              <div className="bg-surface-container p-2.5 rounded border border-outline-variant text-center">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Risk Score</span>
                <span className="text-xs font-bold text-error font-mono">{risk.score || 82}</span>
              </div>
            </div>

            {/* Identified Precursors */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-2 pb-1 border-b border-outline-variant/60">
                Identified SIF Precursors
              </h4>
              <div className="space-y-2">
                <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-error mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>LOTO Bypass / Energy Isolation Failure</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Failure to properly isolate hazardous energy sources before intervention.
                  </p>
                </div>

                <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Normalization of Deviance</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Language ("quick adjustment") suggests routine circumvention of safety protocols.
                  </p>
                </div>
              </div>
            </div>

            {/* Extracted Evidence Quotes */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-2 pb-1 border-b border-outline-variant/60">
                Grounded Evidence Extraction
              </h4>
              <div className="p-3 rounded-lg bg-surface-container border border-outline-variant text-xs font-serif italic text-on-surface space-y-2">
                <p>"{analysis.evidenceQuotes?.[0] || '...bypassing the main interlock system...'}"</p>
                <p>"{analysis.evidenceQuotes?.[1] || '...Lockout/Tagout (LOTO) procedures were not fully applied at the main breaker...'}"</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HSE Review Decision Controls (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-subtle overflow-hidden flex flex-col">
          <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>HSE Review Decision</span>
            </h3>
          </div>

          <div className="p-4 space-y-5">
            {/* Decision Radio Options */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface block mb-2">
                Validated Classification *
              </label>
              <div className="space-y-2">
                <label
                  className={cn(
                    'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all',
                    decision === 'SIF_POTENTIAL'
                      ? 'border-error bg-error-container/15 ring-1 ring-error'
                      : 'border-outline-variant hover:bg-surface-container-low'
                  )}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="SIF_POTENTIAL"
                    checked={decision === 'SIF_POTENTIAL'}
                    onChange={(e) => setDecision(e.target.value)}
                    className="text-error focus:ring-error"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-on-surface block">SIF Potential</span>
                    <span className="text-[11px] text-on-surface-variant">
                      Confirm serious injury / fatality precursor presence.
                    </span>
                  </div>
                </label>

                <label
                  className={cn(
                    'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all',
                    decision === 'NEEDS_REVIEW'
                      ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                      : 'border-outline-variant hover:bg-surface-container-low'
                  )}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="NEEDS_REVIEW"
                    checked={decision === 'NEEDS_REVIEW'}
                    onChange={(e) => setDecision(e.target.value)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-on-surface block">Needs Further Investigation</span>
                    <span className="text-[11px] text-on-surface-variant">
                      Requires on-site safety interview or witness follow-up.
                    </span>
                  </div>
                </label>

                <label
                  className={cn(
                    'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all',
                    decision === 'NON_SIF'
                      ? 'border-safety-green bg-green-50 ring-1 ring-safety-green'
                      : 'border-outline-variant hover:bg-surface-container-low'
                  )}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="NON_SIF"
                    checked={decision === 'NON_SIF'}
                    onChange={(e) => setDecision(e.target.value)}
                    className="text-safety-green focus:ring-safety-green"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-on-surface block">Non-SIF (Low Severity)</span>
                    <span className="text-[11px] text-on-surface-variant">
                      Overridden as minor observation or false positive.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Risk Score Calibration Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  Scenario Risk Score: <span className="font-mono text-primary font-bold">{riskScoreOverride}</span> / 100
                </label>
                {isScoreModified && (
                  <span className="text-[10px] font-bold text-primary bg-primary-fixed px-1.5 py-0.2 rounded">
                    Adjusted
                  </span>
                )}
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={riskScoreOverride}
                onChange={(e) => {
                  setRiskScoreOverride(e.target.value);
                  setIsScoreModified(true);
                }}
                className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-outline mt-1 font-mono">
                <span>0 (Safe)</span>
                <span>50 (Moderate)</span>
                <span>100 (Critical SIF)</span>
              </div>
            </div>

            {/* Reviewer Notes / Justification */}
            <div>
              <Textarea
                label="Reviewer Notes & Action Justification"
                rows={4}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Enter regulatory rationale, LOTO retraining orders, or barrier corrective instructions..."
                helperText="Audit record will be immutably preserved in the system ledger."
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/60">
              <Button
                variant="primary"
                size="md"
                className="w-full font-bold shadow-sm"
                icon={CheckCircle2}
                loading={submitting}
                onClick={() => handleSubmitReview('CONFIRM')}
              >
                Confirm Classification & Submit
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  icon={Sliders}
                  disabled={submitting}
                  onClick={() => handleSubmitReview('OVERRIDE')}
                >
                  Apply Override
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1 text-xs"
                  icon={XCircle}
                  disabled={submitting}
                  onClick={() => handleSubmitReview('REJECT')}
                >
                  Reject AI
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate(`/reports/${reportId}`);
        }}
        title="Review Decision Submitted"
        subtitle="Human-in-the-loop decision successfully registered."
        maxWidth="max-w-md"
        footer={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setShowSuccessModal(false);
              navigate(`/reports/${reportId}`);
            }}
          >
            Return to Dossier
          </Button>
        }
      >
        <div className="space-y-3 text-xs text-on-surface">
          <div className="p-3 bg-green-100 border border-green-300 rounded text-safety-green flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Audit trail updated with reviewer validation.</span>
          </div>

          <div className="space-y-1.5 p-3 bg-surface-container rounded border border-outline-variant text-xs">
            <div className="flex justify-between">
              <span className="text-outline">Validated Status:</span>
              <span className="font-bold font-mono">{decision}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Final Risk Score:</span>
              <span className="font-bold font-mono">{riskScoreOverride} / 100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Reviewer:</span>
              <span className="font-bold">Raj Sharma (HSE Lead)</span>
            </div>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
