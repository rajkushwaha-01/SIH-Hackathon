import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Sparkles,
  X,
  FileSpreadsheet,
  FileType,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  Shield,
} from 'lucide-react';
import { reportsService } from '../../services/reports';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import { Button, Input, Textarea, Select } from '../../components/common';
import { cn } from '../../utils/cn';

const SAMPLE_INCIDENTS = [
  {
    label: 'Offshore Scaffolding Incident',
    text: 'During structural painting on offshore Module B at 8.2 meters elevation, an unclipped scaffolding plank shifted when stepped on. The technician slipped and fell into their dual-lanyard harness. Two scaffolding clamps fell 8m to the deck below, narrowly missing workers in the transit walkway.',
    site: 'Offshore Platform Alpha',
    activity: 'Work at Height & Scaffolding',
    reportType: 'NEAR_MISS',
  },
  {
    label: '440V Arc Flash Near-Miss',
    text: 'An electrician opened a 440V Motor Control Center (MCC) switchboard panel without applying Lockout/Tagout (LOTO) or verifying zero electrical energy. A loose test probe made contact with live busbars, causing an intense electrical arc flash that scorched the cabinet interior.',
    site: 'Refinery Unit 4',
    activity: 'Electrical Switchboard Maintenance',
    reportType: 'INCIDENT',
  },
  {
    label: 'Toxic H2S Pocket Release',
    text: 'During scheduled maintenance on crude desalter separator unit, pipefitters unbolted a 6-inch flange without full atmospheric gas testing. A trapped pocket of hydrogen sulfide (H2S) at 120 ppm was released. Fixed area detectors triggered evacuation alarms.',
    site: 'Refinery Unit 4',
    activity: 'Flange Breaking & Desalter Maintenance',
    reportType: 'INCIDENT',
  },
];

const SITES = [
  'Offshore Platform Alpha',
  'Refinery Unit 4',
  'Chemical Terminal B',
  'Petrochemical Complex Gamma',
  'Pipeline Sector 9',
];

export default function ReportUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [site, setSite] = useState(SITES[0]);
  const [activity, setActivity] = useState('');
  const [reportType, setReportType] = useState('NEAR_MISS');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [reporterName, setReporterName] = useState('Lead HSE Officer');

  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // File Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setFormError(null);
    const validExtensions = ['.pdf', '.csv', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(ext)) {
      setFormError(`Unsupported file format (${ext}). Please upload a PDF, CSV, or TXT document.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFormError('File size exceeds the 10MB limit.');
      return;
    }

    setSelectedFile(file);
    setPastedText(''); // Clear pasted text when file is attached
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadSample = (sample) => {
    setSelectedFile(null);
    setPastedText(sample.text);
    setSite(sample.site);
    setActivity(sample.activity);
    setReportType(sample.reportType);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedFile && !pastedText.trim()) {
      setFormError('Please either upload a report file (.pdf, .csv, .txt) or paste safety report text.');
      return;
    }

    if (!site) {
      setFormError('Please specify the site/facility where the event occurred.');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedFile) {
        // Multipart File Ingestion
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('site', site);
        formData.append('activity', activity || 'General Operations');
        formData.append('reportType', reportType);
        formData.append('eventDate', eventDate);
        formData.append('reporterName', reporterName);

        const result = await reportsService.uploadReport(formData);
        const reportId = result.reports?.[0]?._id || result.reports?.[0]?.reportId || result.reportId;
        
        // Navigate to the real-time NLP analysis progress pipeline
        navigate(`/reports/analyzing?reportId=${reportId || 'new'}&source=file`);
      } else {
        // Text Ingestion
        const payload = {
          rawText: pastedText.trim(),
          site,
          activity: activity || 'General Operations',
          reportType,
          eventDate,
          reporterName,
          sourceType: 'PASTE',
        };

        const result = await reportsService.createReport(payload);
        const reportId = result?._id || result?.reportId || result?.data?._id || result?.data?.reportId;

        if (reportId) {
          navigate(`/reports/analyzing?reportId=${reportId}&source=text`);
        } else {
          setError('Failed to retrieve report ID after ingestion.');
        }
      }
    } catch (err) {
      console.error('Report ingestion failed:', err);
      setError(err?.response?.data?.message || err?.message || 'Report ingestion failed. Please verify the backend service is reachable.');
    } finally {
      setSubmitting(false);
    }
  };

  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.csv')) return FileSpreadsheet;
    if (fileName.endsWith('.pdf')) return FileText;
    return FileType;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Analyze Safety Report"
        description="Ingest safety observations, incident narratives, and near-miss reports for multi-stage NLP precursor detection."
        badge="REPORT INGESTION"
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Sample Templates Ribbon */}
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
            <Bookmark className="w-4 h-4 text-primary-container" />
            <span>Load HSE Test Cases:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_INCIDENTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className="text-xs px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant hover:border-primary-container text-on-surface transition-colors font-medium"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {formError && (
          <div className="p-3 bg-error-container/20 border border-error/40 rounded-lg flex items-center gap-2 text-xs text-error font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className={cn(
              'relative bg-surface-container-lowest border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group shadow-subtle',
              isDragging
                ? 'border-primary-container bg-surface-container-low scale-[1.01]'
                : selectedFile
                ? 'border-primary bg-primary-fixed/20'
                : 'border-outline-variant hover:bg-surface-container-low hover:border-primary-container'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv,.txt"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {selectedFile ? (
              <div
                className="flex items-center justify-between max-w-md mx-auto p-3 bg-surface-container-lowest border border-primary rounded-lg shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 text-left">
                  {React.createElement(getFileIcon(selectedFile.name), {
                    className: 'w-8 h-8 text-primary shrink-0',
                  })}
                  <div className="truncate">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-on-surface-variant font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">
                    Drag & drop report files here
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    or click to browse from your filesystem
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-0.5 bg-surface-container rounded text-[11px] font-mono font-bold text-on-surface-variant">
                    PDF
                  </span>
                  <span className="px-2 py-0.5 bg-surface-container rounded text-[11px] font-mono font-bold text-on-surface-variant">
                    CSV
                  </span>
                  <span className="px-2 py-0.5 bg-surface-container rounded text-[11px] font-mono font-bold text-on-surface-variant">
                    TXT
                  </span>
                  <span className="text-[11px] text-outline ml-1">Up to 10MB</span>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-outline-variant" />
            <span className="text-xs font-bold uppercase tracking-widest text-outline">
              OR PASTE RAW TEXT
            </span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>

          {/* Paste Text Area */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-subtle">
            <Textarea
              label="Safety Report Narrative / Unstructured Observation"
              rows={6}
              value={pastedText}
              onChange={(e) => {
                setPastedText(e.target.value);
                if (selectedFile) setSelectedFile(null);
              }}
              placeholder="Paste the raw text of the safety incident, near-miss report, toolbox talk finding, or unsafe condition..."
              disabled={!!selectedFile}
              helperText={
                selectedFile
                  ? 'File attached. Clear file above if you wish to paste text manually.'
                  : 'Multi-lingual and unstructured text will be parsed by Gemini NLP.'
              }
            />
          </div>

          {/* Metadata Grid */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-subtle">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-4 pb-2 border-b border-outline-variant/60">
              Report Metadata & Site Context
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Site */}
              <Select
                label="Site / Operational Facility *"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                options={SITES.map((s) => ({ value: s, label: s }))}
                required
              />

              {/* Report Type */}
              <Select
                label="Safety Report Classification *"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                options={[
                  { value: 'NEAR_MISS', label: 'Near-Miss Event' },
                  { value: 'INCIDENT', label: 'Incident / Accident' },
                  { value: 'UNSAFE_ACT', label: 'Unsafe Act (UA)' },
                  { value: 'UNSAFE_CONDITION', label: 'Unsafe Condition (UC)' },
                  { value: 'OBSERVATION', label: 'Safety Observation' },
                ]}
                required
              />

              {/* Activity */}
              <Input
                label="Activity at Time of Event"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="e.g. Scaffolding, Electrical LOTO, Pipeline Welding"
              />

              {/* Event Date */}
              <Input
                label="Date of Occurrence *"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary" />
              <span>Grounded NLP extraction • IOGP Life-Saving Rules • Pinecone Indexing</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              icon={Sparkles}
              className="shadow-sm"
            >
              Analyze Safety Report
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
