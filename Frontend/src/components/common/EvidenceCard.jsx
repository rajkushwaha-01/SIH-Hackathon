import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ExternalLink, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { RiskBadge } from './RiskBadge';

export function EvidenceCard({
  reportId,
  id,
  title,
  text,
  site,
  similarity,
  riskScore,
  sifPotential,
  pageNumber,
  factors = [],
  className = '',
  compact = false,
}) {
  const navigate = useNavigate();
  const targetId = id || reportId;

  const handleClick = () => {
    if (targetId) {
      navigate(`/reports/${targetId}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-xs hover:border-primary-container hover:shadow-card transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden',
        compact ? 'p-3' : 'p-4',
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary group-hover:underline flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {reportId || targetId || 'INC-REPORT'}
            </span>
            {pageNumber && (
              <span className="text-[10px] bg-surface-container-high px-1.5 py-0.2 rounded text-on-surface-variant">
                Page {pageNumber}
              </span>
            )}
          </div>

          {similarity !== undefined && similarity !== null && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary-fixed-dim px-2 py-0.5 rounded">
              <Sparkles className="w-3 h-3" />
              {Math.round(similarity * (similarity <= 1 ? 100 : 1))}% Match
            </span>
          )}
        </div>

        {title && (
          <h4 className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1 mb-1">
            {title}
          </h4>
        )}

        {text && (
          <p className="text-xs text-on-surface-variant line-clamp-2 mb-3 leading-relaxed">
            {text}
          </p>
        )}

        {factors && factors.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {factors.slice(0, 3).map((f, i) => (
              <span
                key={i}
                className="text-[10px] font-medium bg-surface-container-low border border-outline-variant/60 px-1.5 py-0.5 rounded text-on-surface-variant truncate max-w-[140px]"
              >
                {typeof f === 'object' ? f.name || f.factor : f}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 mt-auto border-t border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
        <span className="truncate max-w-[150px]">{site || 'Enterprise Location'}</span>
        <div className="flex items-center gap-2 shrink-0">
          {riskScore !== undefined && riskScore !== null && (
            <RiskBadge score={riskScore} size="xs" />
          )}
          <ExternalLink className="w-3.5 h-3.5 text-outline group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}

export default EvidenceCard;
