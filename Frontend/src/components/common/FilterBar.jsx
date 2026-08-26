import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export function FilterBar({
  filters = {},
  onFilterChange,
  onReset,
  sites = [],
  reportTypes = ['INCIDENT', 'NEAR_MISS', 'UNSAFE_ACT', 'UNSAFE_CONDITION', 'OBSERVATION'],
  sifStatuses = ['ALL', 'SIF_POTENTIAL', 'NEEDS_REVIEW', 'NON_SIF'],
  className = '',
}) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div
      className={cn(
        'bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-subtle flex flex-col md:flex-row md:items-center gap-3',
        className
      )}
    >
      <div className="flex-1">
        <Input
          placeholder="Search by keywords, equipment, worker, or ID..."
          icon={Search}
          value={filters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
        />
      </div>

      <div className="w-full md:w-44">
        <Select
          value={filters.site || ''}
          onChange={(e) => handleChange('site', e.target.value)}
          placeholder="All Sites"
          options={sites.map((s) => ({ value: s, label: s }))}
        />
      </div>

      <div className="w-full md:w-40">
        <Select
          value={filters.sifStatus || ''}
          onChange={(e) => handleChange('sifStatus', e.target.value)}
          placeholder="SIF Potential"
          options={[
            { value: '', label: 'All SIF Statuses' },
            { value: 'SIF_POTENTIAL', label: 'SIF Potential' },
            { value: 'NEEDS_REVIEW', label: 'Needs Review' },
            { value: 'NON_SIF', label: 'Non-SIF' },
          ]}
        />
      </div>

      <div className="w-full md:w-36">
        <Select
          value={filters.reportType || ''}
          onChange={(e) => handleChange('reportType', e.target.value)}
          placeholder="Report Type"
          options={[
            { value: '', label: 'All Types' },
            ...reportTypes.map((t) => ({ value: t, label: t.replace('_', ' ') })),
          ]}
        />
      </div>

      {onReset && (
        <Button
          variant="outline"
          size="md"
          icon={RotateCcw}
          onClick={onReset}
          className="shrink-0 text-outline hover:text-on-surface"
          title="Reset Filters"
        >
          Reset
        </Button>
      )}
    </div>
  );
}

export default FilterBar;
