import React from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export function RiskBreakdown({
  factors = [],
  baselineTotal = null,
  simulatedTotal = null,
  isComparison = false,
  className = '',
}) {
  if (!factors || factors.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-outline bg-surface-container-low rounded border border-outline-variant/60">
        No individual factor contributions available.
      </div>
    );
  }

  return (
    <div className={cn('bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-subtle', className)}>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-outline-variant/60">
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">
          Explainable Factor Breakdown
        </h4>
        <span className="text-[10px] text-outline flex items-center gap-1">
          <HelpCircle className="w-3 h-3" />
          Additive Model Weighting
        </span>
      </div>

      <div className="space-y-3">
        {factors.map((f, i) => {
          const name = f.name || f.factor || f.precursor || `Factor #${i + 1}`;
          const baseline = f.baselineScore ?? f.score ?? f.points ?? f.contribution ?? 0;
          const simulated = f.simulatedScore ?? f.newScore;
          const delta = simulated !== undefined ? simulated - baseline : null;
          const maxVal = 40;
          const barWidth = Math.min((baseline / maxVal) * 100, 100);

          return (
            <div key={i} className="text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-on-surface truncate max-w-[200px]">
                  {name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-on-surface tnum">
                    +{baseline}
                  </span>
                  {delta !== null && (
                    <span
                      className={cn(
                        'font-mono font-bold text-[11px] px-1 py-0.2 rounded',
                        delta < 0 ? 'bg-green-100 text-safety-green' : delta > 0 ? 'bg-error-container text-error' : 'bg-surface-container-high text-outline'
                      )}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    baseline >= 20 ? 'bg-error' : baseline >= 12 ? 'bg-primary-container' : 'bg-outline'
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {f.explanation && (
                <p className="text-[10px] text-on-surface-variant mt-0.5 italic">
                  {f.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RiskBreakdown;
