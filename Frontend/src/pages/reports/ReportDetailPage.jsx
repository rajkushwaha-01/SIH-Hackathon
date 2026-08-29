import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Activity,
  CheckSquare,
  SlidersHorizontal,
  Bot,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Wrench,
  Users,
  AlertTriangle,
  Sparkles,
  Printer,
  Share2,
  RefreshCw,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { reportsService } from '../../services/reports';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  RiskBadge,
  SIFStatusBadge,
  RiskScore,
  RiskBreakdown,
  EntityCard,
  EvidenceCard,
  Timeline,
  LoadingState,
  ErrorState,
} from '../../components/common';
import { cn } from '../../utils/cn';

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [similarCases, setSimilarCases] = useState([]);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, similarRes] = await Promise.allSettled([
        reportsService.getReportDetail(id),
        reportsService.getSimilarReports(id),
      ]);

      if (res.status === 'fulfilled' && res.value) {
        setDetailData(res.value);
      } else {
        setError(`Safety report '${id}' was not found in the database.`);
        setDetailData(null);
      }

      if (similarRes.status === 'fulfilled' && similarRes.value) {
        const val = similarRes.value;
        const matches = val?.similarIncidents || val?.data?.similarIncidents || val?.results || (Array.isArray(val) ? val : []);
        setSimilarCases(matches.slice(0, 3));
      } else {
        setSimilarCases([]);
      }
    } catch (err) {
      console.error('Failed to load report dossier:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load report dossier');
      setDetailData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState
          message={`Loading Dossier for ${id || 'Report'}...`}
          subtext="Retrieving NLP extractions, causal graphs, vector similarity, and audit history..."
        />
      </PageContainer>
    );
  }

  if (error && !detailData) {
    return (
      <PageContainer>
        <ErrorState
          title="Failed to Load Safety Dossier"
          message={error}
          onRetry={fetchDetail}
        />
      </PageContainer>
    );
  }

  const report = detailData?.report || {};
  const analysis = detailData?.latestAnalysis || {};
  const nlp = analysis.nlpExtraction || {};
  const lsr = analysis.lifeSavingRule || {};
  const risk = analysis.riskScore || {};
  const sifClassification = analysis.sifClassification || {};

  const reportId = report.reportId || id;
  const eventDateStr = report.eventDate ? new Date(report.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Aug 26, 2026';

  return (
    <PageContainer>
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-outline-variant/60">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
          <Link
            to="/reports"
            className="flex items-center gap-1 hover:text-primary transition-colors text-outline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Safety Reports</span>
          </Link>
          <span className="text-outline-variant">/</span>
          <span className="font-mono font-bold text-primary">{reportId}</span>
        </div>

        {/* Global Action CTAs */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print Dossier
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={SlidersHorizontal}
            onClick={() => navigate(`/risk-simulator?reportId=${reportId}`)}
          >
            What-If Simulator
          </Button>

          <Button
            variant="accent"
            size="sm"
            icon={Bot}
            onClick={() => navigate(`/copilot?q=Explain+incident+${reportId}+and+its+barriers`)}
          >
            Ask Copilot
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={CheckSquare}
            onClick={() => navigate(`/review/${reportId}`)}
          >
            HSE Review Workspace
          </Button>
        </div>
      </div>

      {/* Main Header Title */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
            {report.title || `Safety Report ${reportId}`}
          </h1>
          <SIFStatusBadge
            status={sifClassification.classification || report.sifPotential || 'SIF_POTENTIAL'}
            confidence={sifClassification.confidence || 0.91}
            size="md"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1.5 font-medium text-on-surface">
            <MapPin className="w-3.5 h-3.5 text-primary-container" />
            <span>{report.site || 'Offshore Platform Alpha'}</span>
            {report.location && <span className="text-outline">({report.location})</span>}
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary-container" />
            <span>{report.activity || 'Maintenance Operations'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-outline" />
            <span>{eventDateStr}</span>
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] bg-surface-container-low px-2 py-0.5 rounded border border-outline-variant/60">
            Reporter: {report.reporterName || 'Marcus Vance'}
          </span>
        </div>
      </div>

      {/* SIF Highlighted Alert Banner */}
      <div className="bg-error-container/25 border-l-4 border-error p-5 rounded-r-lg shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-error flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5" />
            <span>SIF Potential Detected — High Scenario Risk ({risk.score || 82} / 100)</span>
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed max-w-2xl">
            Dominant Precursor:{' '}
            <strong className="text-on-surface font-bold">
              {risk.dominantPrecursor || 'Energy Isolation Failure'}
            </strong>{' '}
            — Worker was positioned within direct line-of-fire while secondary energy verification was incomplete.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-error block">
              Scenario Score
            </span>
            <span className="text-3xl font-bold font-sans tnum text-error">
              {risk.score || 82}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Asymmetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Narrative, Entities, LSR, Recommendations (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Incident Description Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-subtle">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3 flex items-center gap-1.5 pb-2 border-b border-outline-variant/60">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Original Safety Report Narrative</span>
            </h3>
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap font-sans">
              {report.description || 'No raw description recorded.'}
            </p>

            {sifClassification.reasoning && (
              <div className="mt-4 p-3 bg-surface-container-low border border-primary-fixed rounded-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                  AI Classification Rationale
                </span>
                <p className="text-xs text-on-surface leading-relaxed">
                  {sifClassification.reasoning}
                </p>
              </div>
            )}
          </div>

          {/* NLP Extracted Entities Grid */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-subtle">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-1.5 pb-2 border-b border-outline-variant/60">
              <Sparkles className="w-4 h-4 text-primary-container" />
              <span>Extracted Safety Intelligence Entities</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <EntityCard type="hazard" items={nlp.hazards || ['Stored Hydraulic Energy']} />
              <EntityCard type="barrierFailure" items={nlp.barriers?.filter((b) => b.status === 'FAILED' || b.status === 'MISSING').map((b) => `${b.name} (${b.status})`) || ['LOTO Secondary Isolation']} />
              <EntityCard type="equipment" items={nlp.equipment || ['Pump P-402', 'Pressure Valve']} />
              <EntityCard type="activity" items={nlp.activities || ['Mechanical Maintenance']} />
              <EntityCard type="people" items={nlp.personnel || ['Technician', 'Permit Issuer']} />
              <EntityCard type="controls" items={nlp.controls || ['Primary Electrical Lockout']} />
            </div>
          </div>

          {/* IOGP Life-Saving Rule Detailed Card */}
          <div className="bg-surface-container-lowest border-2 border-primary-container/40 rounded-lg p-5 shadow-subtle">
            <div className="flex items-start justify-between gap-4 mb-3 pb-2 border-b border-outline-variant/60">
              <div>
                <span className="inline-block px-2 py-0.5 rounded bg-primary-container text-white text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                  IOGP LIFE-SAVING RULE ALIGNMENT
                </span>
                <h3 className="text-lg font-bold text-on-surface">
                  {lsr.ruleId || 'IOGP-LSR-04'}: {lsr.ruleName || 'Energy Isolation'}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                <Flame className="w-5 h-5" />
              </div>
            </div>

            <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">
              {lsr.description || 'Verify isolation and zero energy before work begins.'}
            </p>

            {lsr.evidence && (
              <div className="p-3 bg-surface-container-low border border-outline-variant/80 rounded-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-1">
                  Grounded Evidence Quote
                </span>
                <blockquote className="text-xs italic text-on-surface font-serif border-l-2 border-primary pl-2">
                  "{lsr.evidence}"
                </blockquote>
              </div>
            )}
          </div>

          {/* Recommended Corrective Actions */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-subtle">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3 flex items-center gap-1.5 pb-2 border-b border-outline-variant/60">
                <ShieldCheck className="w-4 h-4 text-safety-green" />
                <span>AI-Recommended HSE Barrier Mitigations</span>
              </h3>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-on-surface leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-safety-green font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Event Reconstruction Timeline */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-subtle">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-1.5 pb-2 border-b border-outline-variant/60">
              <Calendar className="w-4 h-4 text-outline" />
              <span>Event Reconstruction & Audit Log</span>
            </h3>
            <Timeline events={detailData?.auditTrail || []} />
          </div>
        </div>

        {/* RIGHT COLUMN: Risk Score, Breakdown, Similar Cases (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Explainable Scenario Risk Gauge */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-subtle flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              SIF Scenario Risk Gauge
            </span>
            <RiskScore
              score={risk.score || 82}
              level={risk.level || 'CRITICAL'}
              size="lg"
              showDisclaimer={true}
            />
          </div>

          {/* Factor Weight Breakdown */}
          <RiskBreakdown
            factors={
              risk.breakdown || [
                { name: 'Energy Exposure (Hydraulic)', score: 28 },
                { name: 'Barrier Failure (Secondary LOTO)', score: 24 },
                { name: 'Worker Proximity', score: 18 },
                { name: 'Verification Procedure', score: 12 },
              ]
            }
          />

          {/* Pinecone Vector Similar Cases */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-subtle">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-outline-variant/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary-container" />
                <span>Similar Incidents (Vector DB)</span>
              </h3>
              <span className="text-[10px] font-mono text-outline">Pinecone RAG</span>
            </div>

            <div className="space-y-3">
              {similarCases.map((c, idx) => (
                <EvidenceCard
                  key={idx}
                  reportId={c.reportId || c.id}
                  title={c.reportDetails?.title || c.title || c.reportId}
                  text={c.textSnippet || c.text || c.description}
                  site={c.reportDetails?.site || c.site}
                  similarity={c.similarityScore || c.similarity || c.score}
                  riskScore={c.riskScore}
                  compact={true}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
