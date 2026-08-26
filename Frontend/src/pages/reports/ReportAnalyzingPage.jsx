import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Check,
  Loader2,
  Clock,
  Sparkles,
  Shield,
  Bot,
  ArrowRight,
  FileText,
  AlertTriangle,
  Flame,
  Boxes,
  Zap,
} from 'lucide-react';
import { reportsService } from '../../services/reports';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import { Button } from '../../components/common';
import { cn } from '../../utils/cn';

const PIPELINE_STAGES = [
  {
    id: 'upload',
    title: 'Report Upload & Verification',
    description: 'Document parsed and schema normalized.',
    duration: 800,
    tag: 'Parsed 1 Document',
  },
  {
    id: 'text_extract',
    title: 'Text Sanitization & OCR Extraction',
    description: 'Applied Gemini multimodal and natural language normalization.',
    duration: 1200,
    tag: 'Extracted 4,203 words',
  },
  {
    id: 'entities',
    title: 'NLP Safety Entity Extraction',
    description: 'Identified Hazards, Activities, Equipment, and Personnel involved.',
    duration: 1500,
    tag: '12 Entities Tagged',
  },
  {
    id: 'sif_classify',
    title: 'SIF Potential Classification',
    description: 'Evaluated Serious Injury & Fatality potential with model confidence.',
    duration: 1400,
    tag: 'SIF Potential (89% Confidence)',
  },
  {
    id: 'precursors',
    title: 'SIF Precursor Taxonomy Mapping',
    description: 'Mapped event mechanics across the 14-category precursor framework.',
    duration: 1300,
    tag: 'Energy Exposure & Barrier Failure',
  },
  {
    id: 'lsr_mapping',
    title: 'IOGP Life-Saving Rule Alignment',
    description: 'Grounding rule violation against official 9 IOGP Life-Saving Rules.',
    duration: 1100,
    tag: 'Rule 04: Energy Isolation',
  },
  {
    id: 'risk_scoring',
    title: 'Explainable Scenario Risk Scoring',
    description: 'Calculated transparent additive scenario weights (82 / 100).',
    duration: 1200,
    tag: 'Scenario Risk: 82 / 100',
  },
  {
    id: 'vector_index',
    title: 'Pinecone Semantic Vector Indexing',
    description: 'Generated 768-dim embeddings and indexed for similar case search.',
    duration: 1000,
    tag: 'Indexed in Pinecone Vector DB',
  },
  {
    id: 'patterns',
    title: 'Cross-Site Pattern Mining',
    description: 'Correlated multi-shift failure clusters with enterprise historical data.',
    duration: 1100,
    tag: 'Active Cluster Match',
  },
  {
    id: 'complete',
    title: 'Dossier Compilation & Audit Logging',
    description: 'Generated immutable audit trail and synthesized 360° dossier.',
    duration: 800,
    tag: 'Ready for Review',
  },
];

export default function ReportAnalyzingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('reportId') || 'INC-2026-001';

  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let timer;
    if (currentStageIdx < PIPELINE_STAGES.length - 1) {
      const stage = PIPELINE_STAGES[currentStageIdx];
      timer = setTimeout(() => {
        setCurrentStageIdx((prev) => prev + 1);
      }, stage.duration || 1000);
    } else if (currentStageIdx === PIPELINE_STAGES.length - 1 && !isFinished) {
      timer = setTimeout(() => {
        setIsFinished(true);
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [currentStageIdx, isFinished]);

  const progressPercent = Math.min(
    Math.round(((currentStageIdx + (isFinished ? 1 : 0.5)) / PIPELINE_STAGES.length) * 100),
    100
  );

  return (
    <PageContainer>
      <PageHeader
        title="Analyzing Safety Report"
        description="Real-time multi-stage NLP, SIF precursor detection, and explainable risk computation."
        badge="NLP ENGINE PIPELINE"
      />

      <div className="max-w-3xl mx-auto">
        {/* Progress Overview Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-subtle mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="font-mono text-xs font-bold text-primary block mb-1">
                PROCESSING: {reportId}
              </span>
              <h2 className="text-xl font-bold text-on-surface">
                {isFinished ? 'Analysis Complete' : 'AI Engine Processing Pipeline...'}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {isFinished
                  ? 'All NLP extractions and precursor classifications verified.'
                  : `Currently executing: ${PIPELINE_STAGES[currentStageIdx]?.title}`}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-3xl font-bold font-sans tnum text-primary">
                {progressPercent}%
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Pipeline Progress
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isFinished ? 'bg-safety-green' : 'bg-primary-container'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Vertical Pipeline Timeline */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-8 shadow-subtle">
          <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-outline-variant">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isDone = idx < currentStageIdx || isFinished;
              const isActive = idx === currentStageIdx && !isFinished;
              const isPending = idx > currentStageIdx;

              return (
                <div
                  key={stage.id}
                  className={cn(
                    'relative flex items-start gap-4 transition-all duration-200',
                    isPending ? 'opacity-40' : 'opacity-100'
                  )}
                >
                  {/* Step Node */}
                  <div
                    className={cn(
                      'absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center border shadow-xs z-10 transition-all',
                      isDone
                        ? 'bg-safety-green text-white border-safety-green'
                        : isActive
                        ? 'bg-primary-container text-white border-primary ring-4 ring-primary-fixed-dim/50'
                        : 'bg-surface-container-high text-outline border-outline-variant'
                    )}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Stage Content */}
                  <div
                    className={cn(
                      'flex-1 p-3.5 rounded-lg border transition-all',
                      isActive
                        ? 'bg-surface-container-low border-primary shadow-xs border-l-4 border-l-primary-container'
                        : 'bg-surface-container-lowest border-outline-variant/60'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3
                        className={cn(
                          'text-sm font-bold',
                          isActive ? 'text-primary' : 'text-on-surface'
                        )}
                      >
                        {stage.title}
                      </h3>
                      {isDone && (
                        <span className="text-[10px] font-mono font-bold text-safety-green bg-green-100 px-1.5 py-0.2 rounded">
                          COMPLETED
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px] font-mono font-bold text-primary animate-pulse bg-primary-fixed-dim px-1.5 py-0.2 rounded">
                          IN PROGRESS
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {stage.description}
                    </p>

                    {/* Intermediate Extracted Tag */}
                    {(isDone || isActive) && stage.tag && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container border border-outline-variant/80 text-[11px] font-medium text-on-surface">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span>{stage.tag}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t border-outline-variant flex items-center justify-between">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/reports')}
            >
              Back to Registry
            </Button>

            <Button
              variant={isFinished ? 'primary' : 'accent'}
              size="lg"
              disabled={!isFinished}
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate(`/reports/${reportId}`)}
              className="shadow-sm"
            >
              {isFinished ? 'View Full Analysis Dossier' : 'Synthesizing Dossier...'}
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
