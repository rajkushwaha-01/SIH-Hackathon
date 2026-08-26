import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Bot,
  Bell,
  User,
  ShieldCheck,
  Save,
  CheckCircle2,
  Lock,
  Database,
  Sparkles,
  Layers,
} from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  Input,
  Select,
  Tabs,
  Modal,
} from '../../components/common';
import { cn } from '../../utils/cn';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('THRESHOLDS');
  const [saving, setSaving] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);

  // Settings State
  const [criticalThreshold, setCriticalThreshold] = useState(75);
  const [confidenceCutoff, setConfidenceCutoff] = useState(70);
  const [autoFlagReview, setAutoFlagReview] = useState(true);
  const [vectorThreshold, setVectorThreshold] = useState(0.65);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [digestTime, setDigestTime] = useState('08:00');
  const [userName, setUserName] = useState('Raj Sharma');
  const [userEmail, setUserEmail] = useState('hse.officer@safety.org');
  const [userRole, setUserRole] = useState('Lead HSE Analyst');
  const [primarySite, setPrimarySite] = useState('Offshore Platform Alpha');

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setShowSavedModal(true);
    }, 600);
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Settings & System Configuration"
        description="Configure SIF risk scoring thresholds, AI precursor sensitivity, vector parameters, and user preferences."
        badge="SYSTEM CONFIGURATION"
        actions={
          <Button
            variant="primary"
            size="md"
            icon={Save}
            loading={saving}
            onClick={handleSave}
            className="shadow-sm font-bold"
          >
            Save Changes
          </Button>
        }
      />

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={[
            { id: 'THRESHOLDS', label: 'SIF Risk Thresholds', icon: Sliders },
            { id: 'AI_MODELS', label: 'AI & Vector Engine', icon: Bot },
            { id: 'NOTIFICATIONS', label: 'Notifications & Alerts', icon: Bell },
            { id: 'PROFILE', label: 'User Profile & Security', icon: User },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Content Panes */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-subtle max-w-4xl">
        {/* TAB 1: SIF RISK THRESHOLDS */}
        {activeTab === 'THRESHOLDS' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-outline-variant/60">
              <h3 className="text-base font-bold text-on-surface">
                SIF Detection & Severity Calibration
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Tune the mathematical cutoffs triggering automated alerts and human reviews
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    Critical SIF Alarm Threshold: <span className="font-mono text-error font-bold">{criticalThreshold}</span> / 100
                  </label>
                  <span className="text-[11px] text-outline">
                    Scores ≥ {criticalThreshold} trigger immediate P1 alerts
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="90"
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(e.target.value)}
                  className="w-full accent-error h-2 bg-surface-container-high rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    Minimum Precursor Confidence: <span className="font-mono text-primary font-bold">{confidenceCutoff}%</span>
                  </label>
                  <span className="text-[11px] text-outline">
                    Discard NLP detections below this confidence
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="90"
                  value={confidenceCutoff}
                  onChange={(e) => setConfidenceCutoff(e.target.value)}
                  className="w-full accent-primary h-2 bg-surface-container-high rounded cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-on-surface">
                    Enforce Mandatory Human Review on SIF Potential
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    Automatically route all reports with score ≥ 75 to the HSE Review Workspace
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoFlagReview}
                  onChange={(e) => setAutoFlagReview(e.target.checked)}
                  className="w-5 h-5 text-primary rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI & VECTOR ENGINE */}
        {activeTab === 'AI_MODELS' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-outline-variant/60">
              <h3 className="text-base font-bold text-on-surface">
                Language Model & Vector Store Parameters
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Manage foundational NLP pipelines and Pinecone index thresholds
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Primary Generative AI Model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                options={[
                  { value: 'gemini-2.5-flash', label: 'Google Gemini 2.5 Flash (Ultra Fast)' },
                  { value: 'gemini-1.5-pro', label: 'Google Gemini 1.5 Pro (Deep Reasoning)' },
                ]}
              />

              <Input
                label="Pinecone Vector Namespace"
                value="sif-safety-precursors-prod"
                disabled
                helperText="Active vector index embedding dimension: 768"
              />

              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    Semantic Search Similarity Cutoff: <span className="font-mono text-primary font-bold">{Math.round(vectorThreshold * 100)}%</span>
                  </label>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.9"
                  step="0.05"
                  value={vectorThreshold}
                  onChange={(e) => setVectorThreshold(parseFloat(e.target.value))}
                  className="w-full accent-primary h-2 bg-surface-container-high rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS & ALERTS */}
        {activeTab === 'NOTIFICATIONS' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-outline-variant/60">
              <h3 className="text-base font-bold text-on-surface">
                HSE Notification Dispatch
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Configure immediate alert broadcast and digest schedules
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant/60">
                <div>
                  <h4 className="text-sm font-bold text-on-surface">
                    Real-time Email Alerts for Critical (P1) Events
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    Send instantaneous email dispatch when high-potential clusters are detected
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-5 h-5 text-primary rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Daily Safety Digest Dispatch Time"
                  type="time"
                  value={digestTime}
                  onChange={(e) => setDigestTime(e.target.value)}
                />
                <Input
                  label="Escalation Recipient Group"
                  value="hse-executives@enterprise.org"
                  disabled
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USER PROFILE */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-outline-variant/60">
              <h3 className="text-base font-bold text-on-surface">
                HSE Officer Profile & Location
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Manage reviewer identification credentials and primary facility assignment
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <Input
                label="Official Email Address"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
              <Input
                label="Organization Role"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
              />
              <Select
                label="Primary Assigned Facility"
                value={primarySite}
                onChange={(e) => setPrimarySite(e.target.value)}
                options={[
                  { value: 'Offshore Platform Alpha', label: 'Offshore Platform Alpha' },
                  { value: 'Refinery Unit 4', label: 'Refinery Unit 4' },
                  { value: 'Chemical Terminal B', label: 'Chemical Terminal B' },
                  { value: 'Petrochemical Complex Gamma', label: 'Petrochemical Complex Gamma' },
                  { value: 'Pipeline Sector 9', label: 'Pipeline Sector 9' },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        title="Settings Updated"
        subtitle="System configuration preferences saved successfully."
        maxWidth="max-w-sm"
        footer={
          <Button variant="primary" size="md" onClick={() => setShowSavedModal(false)}>
            Close
          </Button>
        }
      >
        <div className="text-xs text-on-surface flex items-center gap-2 p-3 bg-green-100 border border-green-300 rounded text-safety-green font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Configuration synced across all microservices.</span>
        </div>
      </Modal>
    </PageContainer>
  );
}
