import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SIFStatusBadge } from './SIFStatusBadge';
import { RiskBadge } from './RiskBadge';

export function ReportCard({ report, className = '' }) {
  const navigate = useNavigate();

  if (!report) return null;

  const id = report._id || report.id || report.reportId;
  const title = report.title || report.description?.slice(0, 70) || 'Untitled Safety Report';
  const site = report.site || 'Unassigned Site';
  const eventDate = report.eventDate ? new Date(report.eventDate).toLocaleDateString() : 'Recent';
  const sifStatus = report.sifClassification?.status || report.sifPotential || 'NEEDS_REVIEW';
  const confidence = report.sifClassification?.confidence || report.confidence;
  const riskScore = report.riskAssessment?.overallScore || report.riskScore || 0;

  return (
    <div
      onClick={() => navigate(`/reports/${id}`)}
      className={cn(
        'group bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-subtle hover:border-primary-container hover:shadow-card transition-all cursor-pointer flex flex-col justify-between',
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-xs font-bold text-primary">
            {report.reportId || id}
          </span>
          <div className="flex items-center gap-1.5">
            <SIFStatusBadge status={sifStatus} confidence={confidence} size="xs" />
            <RiskBadge score={riskScore} size="xs" />
          </div>
        </div>

        <h4 className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-snug">
          {title}
        </h4>
      </div>

      <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
        <div className="flex items-center gap-3 truncate">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-outline shrink-0" />
            <span className="truncate max-w-[120px]">{site}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-outline" />
            <span>{eventDate}</span>
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}

export default ReportCard;
