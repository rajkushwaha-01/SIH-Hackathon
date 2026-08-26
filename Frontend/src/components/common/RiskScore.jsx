import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '../../utils/cn';

export function RiskScore({
  score = 0,
  maxScore = 100,
  level = null,
  size = 'md',
  showDisclaimer = true,
  className = '',
}) {
  const numericScore = Math.min(Math.max(Number(score) || 0, 0), maxScore);
  const percentage = (numericScore / maxScore) * 100;

  let riskLevel = level;
  if (!riskLevel) {
    if (numericScore >= 75) riskLevel = 'CRITICAL';
    else if (numericScore >= 50) riskLevel = 'HIGH';
    else if (numericScore >= 25) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';
  }

  let strokeColor = '#2E7D32';
  let textColor = 'text-safety-green';
  let badgeBg = 'bg-green-100 text-safety-green border-green-300';

  if (riskLevel === 'CRITICAL') {
    strokeColor = '#ba1a1a';
    textColor = 'text-error';
    badgeBg = 'bg-error text-white border-error';
  } else if (riskLevel === 'HIGH') {
    strokeColor = '#d9381e';
    textColor = 'text-red-700';
    badgeBg = 'bg-error-container text-error border-error/30 font-bold';
  } else if (riskLevel === 'MEDIUM') {
    strokeColor = '#f57f17';
    textColor = 'text-amber-700';
    badgeBg = 'bg-amber-100 text-amber-900 border-amber-300';
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeDimensions = {
    sm: { svgSize: 70, stroke: 6, text: 'text-lg', label: 'text-[10px]' },
    md: { svgSize: 100, stroke: 8, text: 'text-2xl', label: 'text-xs' },
    lg: { svgSize: 130, stroke: 10, text: 'text-3xl', label: 'text-sm' },
  }[size];

  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <div className="relative flex items-center justify-center">
        <svg
          width={sizeDimensions.svgSize}
          height={sizeDimensions.svgSize}
          className="transform -rotate-90"
        >
          <circle
            cx={sizeDimensions.svgSize / 2}
            cy={sizeDimensions.svgSize / 2}
            r={radius}
            stroke="#e1e2ec"
            strokeWidth={sizeDimensions.stroke}
            fill="transparent"
          />
          <circle
            cx={sizeDimensions.svgSize / 2}
            cy={sizeDimensions.svgSize / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={sizeDimensions.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold font-sans tnum leading-none', sizeDimensions.text, textColor)}>
            {numericScore}
          </span>
          <span className="text-[10px] text-outline font-medium">/ {maxScore}</span>
        </div>
      </div>

      <div className="mt-2">
        <span className={cn('inline-block px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider border', badgeBg)}>
          {riskLevel} Risk
        </span>
      </div>

      {showDisclaimer && (
        <p className="text-[10px] text-outline flex items-center justify-center gap-1 mt-2 text-center max-w-xs leading-tight">
          <Info className="w-3 h-3 shrink-0" />
          <span>Scenario risk score for decision support. Not a scientifically validated probability of injury or fatality.</span>
        </p>
      )}
    </div>
  );
}

export default RiskScore;
