import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  TrendingDown,
  Info,
  Layers,
  Flame,
  Wrench,
  Users,
  Shield,
  Download,
  Bot,
} from 'lucide-react';
import { simulatorService } from '../../services/simulator';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  Select,
  RiskScore,
  RiskBreakdown,
  Modal,
} from '../../components/common';
import { cn } from '../../utils/cn';

const SCENARIO_PRESETS = [
  {
    id: 'INC-1021',
    label: 'INC-1021: Line 4 Hydraulic Valve LOTO Bypass',
    baseScore: 82,
    baseSif: 'SIF_POTENTIAL',
    description: 'Maintenance technician bypassed primary interlock and failed to verify secondary zero hydraulic pressure.',
    baseFactors: [
      { name: 'Energy Exposure (Hydraulic 3000 PSI)', score: 28 },
      { name: 'Barrier Failure (Secondary LOTO Omission)', score: 24 },
      { name: 'Worker Proximity within Line-of-Fire', score: 18 },
      { name: 'Control Verification Missing', score: 12 },
    ],
  },
  {
    id: 'INC-2026-001',
    label: 'INC-2026-001: Offshore Scaffolding Plank Shift at 8m',
    baseScore: 82,
    baseSif: 'SIF_POTENTIAL',
    description: 'Unclipped plank shifted at 8.2m elevation; technician fell into harness; clamps fell 8m to lower deck.',
    baseFactors: [
      { name: 'Gravitational Fall Potential (8m)', score: 32 },
      { name: 'Scaffolding Defect (Missing Clips)', score: 24 },
      { name: 'Transit Walkway Exclusion Failure', score: 16 },
      { name: 'Pre-Shift Inspection Omission', score: 10 },
    ],
  },
  {
    id: 'INC-2026-002',
    label: 'INC-2026-002: 440V Motor Control Center Arc Flash',
    baseScore: 88,
    baseSif: 'SIF_POTENTIAL',
    description: 'Electrician opened live 440V switchboard without zero-voltage verification or arc flash PPE.',
    baseFactors: [
      { name: 'High Voltage Arc Flash Energy', score: 36 },
      { name: 'Zero-Voltage Verification Omission', score: 26 },
      { name: 'Arc Flash PPE Missing', score: 16 },
      { name: 'Live Cabinet Access Protocol Failure', score: 10 },
    ],
  },
];

const AVAILABLE_CONTROLS = [
  {
    id: 'ctrl-eng-interlock',
    name: 'Hardwired Keyed Safety Interlock',
    category: 'ENGINEERING',
    reduction: 22,
    description: 'Physical interlock prevents machine entry while energy sources remain connected.',
  },
  {
    id: 'ctrl-eng-relief',
    name: 'Automated Pressure Bleed-off Valve',
    category: 'ENGINEERING',
    reduction: 18,
    description: 'Depressurizes isolated hydraulic loops automatically upon lock engagement.',
  },
  {
    id: 'ctrl-eng-sensor',
    name: 'Radar Line-of-Fire Proximity Alarm',
    category: 'ENGINEERING',
    reduction: 12,
    description: 'Audible alarm & conveyor trip if personnel breach hazardous threshold.',
  },
  {
    id: 'ctrl-admin-dual-loto',
    name: 'Mandatory Digital Dual LOTO Signoff',
    category: 'ADMINISTRATIVE',
    reduction: 20,
    description: 'Permit system requires two qualified technicians to verify zero-energy test logs.',
  },
  {
    id: 'ctrl-admin-gas-test',
    name: 'Continuous Multi-Gas Monitoring',
    category: 'ADMINISTRATIVE',
    reduction: 14,
    description: 'Fixed and wearable monitors alerting at 5 ppm H2S / 10% LEL.',
  },
  {
    id: 'ctrl-ppe-harness',
    name: '100% Dual Lanyard Tie-off with SRL',
    category: 'PPE',
    reduction: 16,
    description: 'Self-Retracting Lifeline (SRL) anchor point above worker shoulder height.',
  },
  {
    id: 'ctrl-ppe-arc-suit',
    name: 'Arc Flash Category 4 Suit & Visor',
    category: 'PPE',
    reduction: 12,
    description: '40 cal/cm² rated complete body protection.',
  },
];

export default function WhatIfSimulatorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialReportId = searchParams.get('reportId') || 'INC-1021';
  const [selectedScenarioId, setSelectedScenarioId] = useState(initialReportId);
  const [selectedControlIds, setSelectedControlIds] = useState(['ctrl-eng-interlock', 'ctrl-admin-dual-loto']);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const activeScenario = useMemo(() => {
    return SCENARIO_PRESETS.find((s) => s.id === selectedScenarioId) || SCENARIO_PRESETS[0];
  }, [selectedScenarioId]);

  // Calculate simulated score
  const totalReduction = useMemo(() => {
    return selectedControlIds.reduce((acc, ctrlId) => {
      const found = AVAILABLE_CONTROLS.find((c) => c.id === ctrlId);
      return acc + (found ? found.reduction : 0);
    }, 0);
  }, [selectedControlIds]);

  const simulatedScore = Math.max(activeScenario.baseScore - totalReduction, 12);
  const percentageReduction = Math.round(((activeScenario.baseScore - simulatedScore) / activeScenario.baseScore) * 100);

  const simulatedSifStatus = simulatedScore <= 35 ? 'NON_SIF' : simulatedScore <= 60 ? 'NEEDS_REVIEW' : 'SIF_POTENTIAL';

  const toggleControl = (ctrlId) => {
    setIsSimulating(true);
    setSelectedControlIds((prev) =>
      prev.includes(ctrlId) ? prev.filter((id) => id !== ctrlId) : [...prev, ctrlId]
    );
    setTimeout(() => setIsSimulating(false), 200);
  };

  const handleResetControls = () => {
    setSelectedControlIds([]);
  };

  const handleSelectAll = () => {
    setSelectedControlIds(AVAILABLE_CONTROLS.map((c) => c.id));
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="What-If Risk Simulator"
        description="Counterfactual risk modeling: Simulate how engineered barriers, administrative controls, and PPE mitigate SIF potential."
        badge="WOW FEATURE #2"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              icon={RotateCcw}
              onClick={handleResetControls}
            >
              Reset Controls
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Download}
              onClick={() => setShowSaveModal(true)}
            >
              Save Scenario Snapshot
            </Button>
          </div>
        }
      />

      {/* Scenario Selector Ribbon */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-subtle mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface block mb-1">
            Active Baseline Incident Scenario:
          </label>
          <div className="w-full md:max-w-md">
            <Select
              value={selectedScenarioId}
              onChange={(e) => {
                setSelectedScenarioId(e.target.value);
                setSelectedControlIds(['ctrl-eng-interlock', 'ctrl-admin-dual-loto']);
              }}
              options={SCENARIO_PRESETS.map((s) => ({ value: s.id, label: s.label }))}
            />
          </div>
        </div>

        <div className="text-xs text-on-surface-variant max-w-md italic leading-relaxed">
          "{activeScenario.description}"
        </div>
      </div>

      {/* Side-by-Side Dual Risk Dial Banner */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-subtle mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left: Baseline Score */}
          <div className="flex flex-col items-center text-center p-4 bg-error-container/10 border border-error/30 rounded-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-error mb-2">
              Original Baseline Risk
            </span>
            <RiskScore
              score={activeScenario.baseScore}
              level={activeScenario.baseScore >= 75 ? 'CRITICAL' : 'HIGH'}
              size="md"
              showDisclaimer={false}
            />
            <span className="text-xs font-bold text-error mt-2">
              Status: SIF POTENTIAL
            </span>
          </div>

          {/* Center: Delta Indicator */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 border border-green-300 flex items-center justify-center text-safety-green mb-2 shadow-xs">
              <TrendingDown className="w-6 h-6" />
            </div>

            <span className="text-3xl font-bold font-sans tnum text-safety-green">
              -{totalReduction} Pts
            </span>

            <span className="inline-block px-2.5 py-0.5 rounded-full bg-green-100 text-safety-green font-bold text-xs mt-1 font-mono">
              {percentageReduction}% Risk Reduction
            </span>

            <p className="text-[11px] text-outline mt-2">
              {selectedControlIds.length} Active Controls Simulated
            </p>
          </div>

          {/* Right: Simulated Score */}
          <div className="flex flex-col items-center text-center p-4 bg-green-50/60 border border-green-300/80 rounded-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-safety-green mb-2">
              Counterfactual Simulated Risk
            </span>
            <RiskScore
              score={simulatedScore}
              level={simulatedScore <= 35 ? 'LOW' : simulatedScore <= 60 ? 'MEDIUM' : 'HIGH'}
              size="md"
              showDisclaimer={false}
            />
            <span className="text-xs font-bold text-safety-green mt-2">
              Simulated: {simulatedSifStatus.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Mandated Safety Disclaimer */}
        <div className="mt-4 pt-4 border-t border-outline-variant/60 text-center">
          <p className="text-[11px] text-outline flex items-center justify-center gap-1.5 leading-snug">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              Scenario risk score for decision support. Not a scientifically validated probability of injury or fatality.
            </span>
          </p>
        </div>
      </div>

      {/* Main Grid: Control Selection Checklist (8 cols) & Factor Delta Breakdown (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Hierarchy of Controls Selector (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-subtle space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
            <div>
              <h3 className="text-base font-bold text-on-surface">
                Hierarchy of Controls Selection
              </h3>
              <p className="text-xs text-on-surface-variant">
                Toggle prospective engineered and administrative barriers to evaluate counterfactual protection
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Apply All
              </button>
            </div>
          </div>

          {/* Group 1: Engineering Controls */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
              <Wrench className="w-4 h-4" />
              <span>1. Engineering Controls (Highest Reliability)</span>
            </h4>

            <div className="space-y-2.5">
              {AVAILABLE_CONTROLS.filter((c) => c.category === 'ENGINEERING').map((ctrl) => {
                const isChecked = selectedControlIds.includes(ctrl.id);
                return (
                  <div
                    key={ctrl.id}
                    onClick={() => toggleControl(ctrl.id)}
                    className={cn(
                      'p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 select-none',
                      isChecked
                        ? 'bg-primary-fixed/20 border-primary shadow-xs'
                        : 'bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-on-surface">
                          {ctrl.name}
                        </span>
                        <span className="text-xs font-bold font-mono text-safety-green bg-green-100 px-2 py-0.5 rounded">
                          -{ctrl.reduction} pts
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        {ctrl.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group 2: Administrative Controls */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary-container" />
              <span>2. Administrative & Procedural Controls</span>
            </h4>

            <div className="space-y-2.5">
              {AVAILABLE_CONTROLS.filter((c) => c.category === 'ADMINISTRATIVE').map((ctrl) => {
                const isChecked = selectedControlIds.includes(ctrl.id);
                return (
                  <div
                    key={ctrl.id}
                    onClick={() => toggleControl(ctrl.id)}
                    className={cn(
                      'p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 select-none',
                      isChecked
                        ? 'bg-primary-fixed/20 border-primary shadow-xs'
                        : 'bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-on-surface">
                          {ctrl.name}
                        </span>
                        <span className="text-xs font-bold font-mono text-safety-green bg-green-100 px-2 py-0.5 rounded">
                          -{ctrl.reduction} pts
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        {ctrl.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group 3: PPE */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-outline mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>3. Personal Protective Equipment (PPE)</span>
            </h4>

            <div className="space-y-2.5">
              {AVAILABLE_CONTROLS.filter((c) => c.category === 'PPE').map((ctrl) => {
                const isChecked = selectedControlIds.includes(ctrl.id);
                return (
                  <div
                    key={ctrl.id}
                    onClick={() => toggleControl(ctrl.id)}
                    className={cn(
                      'p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 select-none',
                      isChecked
                        ? 'bg-primary-fixed/20 border-primary shadow-xs'
                        : 'bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-on-surface">
                          {ctrl.name}
                        </span>
                        <span className="text-xs font-bold font-mono text-safety-green bg-green-100 px-2 py-0.5 rounded">
                          -{ctrl.reduction} pts
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        {ctrl.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Factor Delta Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-subtle space-y-4">
          <div className="pb-3 border-b border-outline-variant/60">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Factor Contribution Delta
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Comparison of baseline vs simulated additive weights
            </p>
          </div>

          <div className="space-y-3">
            {activeScenario.baseFactors.map((factor, idx) => {
              const reductionFactor = selectedControlIds.length > 0 ? Math.min(factor.score * 0.6, totalReduction / 3) : 0;
              const mitigatedScore = Math.max(Math.round(factor.score - reductionFactor), 2);
              const delta = mitigatedScore - factor.score;

              return (
                <div key={idx} className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/60 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-on-surface truncate max-w-[180px]">
                      {factor.name}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-outline line-through">{factor.score}</span>
                      <span className="font-bold text-safety-green">{mitigatedScore}</span>
                      {delta < 0 && (
                        <span className="text-[10px] font-bold text-safety-green bg-green-100 px-1 rounded">
                          {delta}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-safety-green h-full rounded-full transition-all duration-500"
                      style={{ width: `${(mitigatedScore / 40) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-outline-variant/60 space-y-2">
            <Button
              variant="accent"
              size="sm"
              className="w-full text-xs"
              icon={Bot}
              onClick={() => navigate(`/copilot?q=Explain+the+risk+reduction+achieved+by+adding+engineering+interlocks+to+${activeScenario.id}`)}
            >
              Ask Copilot About Controls
            </Button>
          </div>
        </div>
      </div>

      {/* Snapshot Save Confirmation Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Scenario Snapshot Exported"
        subtitle="What-If simulation model saved to enterprise risk ledger."
        maxWidth="max-w-md"
        footer={
          <Button variant="primary" size="md" onClick={() => setShowSaveModal(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3 text-xs text-on-surface">
          <div className="p-3 bg-green-100 border border-green-300 rounded text-safety-green flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Counterfactual risk model registered successfully.</span>
          </div>

          <div className="space-y-1.5 p-3 bg-surface-container rounded border border-outline-variant">
            <div className="flex justify-between">
              <span className="text-outline">Scenario:</span>
              <span className="font-bold">{activeScenario.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Baseline Score:</span>
              <span className="font-mono text-error font-bold">{activeScenario.baseScore} / 100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Simulated Score:</span>
              <span className="font-mono text-safety-green font-bold">{simulatedScore} / 100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Risk Reduction:</span>
              <span className="font-mono font-bold text-safety-green">-{totalReduction} pts ({percentageReduction}%)</span>
            </div>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
