import React from 'react';
import {
  Activity,
  AlertTriangle,
  Wrench,
  Users,
  ShieldX,
  ShieldCheck,
  MapPin,
  Flame,
  FileWarning,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const ICONS = {
  activity: Activity,
  hazard: Flame,
  equipment: Wrench,
  people: Users,
  unsafeAct: FileWarning,
  unsafeCondition: AlertTriangle,
  controls: ShieldCheck,
  barrierFailure: ShieldX,
  location: MapPin,
};

const LABELS = {
  activity: 'Activity',
  hazard: 'Hazard / Energy',
  equipment: 'Equipment Involved',
  people: 'People / Roles',
  unsafeAct: 'Unsafe Act',
  unsafeCondition: 'Unsafe Condition',
  controls: 'Existing Controls',
  barrierFailure: 'Barrier Failure',
  location: 'Specific Location',
};

export function EntityCard({
  type = 'activity',
  items = [],
  value = null,
  confidence = null,
  className = '',
}) {
  const Icon = ICONS[type] || Activity;
  const label = LABELS[type] || type;

  const dataList = items.length > 0 ? items : value ? (Array.isArray(value) ? value : [value]) : [];

  return (
    <div
      className={cn(
        'bg-surface-container-lowest border border-outline-variant rounded-lg p-3.5 shadow-subtle flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-outline-variant/50">
        <div className="flex items-center gap-1.5 text-primary">
          <Icon className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
            {label}
          </span>
        </div>
        {confidence && (
          <span className="text-[10px] font-mono text-outline">
            {Math.round(confidence * (confidence <= 1 ? 100 : 1))}% conf.
          </span>
        )}
      </div>

      <div className="flex-1">
        {dataList.length === 0 ? (
          <p className="text-xs text-outline italic">None detected in text</p>
        ) : (
          <ul className="space-y-1">
            {dataList.map((item, idx) => {
              const text = typeof item === 'object' ? item.name || item.value || JSON.stringify(item) : String(item);
              return (
                <li key={idx} className="text-xs text-on-surface flex items-start gap-1.5 leading-snug">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container mt-1.5 shrink-0" />
                  <span>{text}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default EntityCard;
