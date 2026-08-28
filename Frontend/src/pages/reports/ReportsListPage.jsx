import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Upload,
  Calendar,
  MapPin,
  Eye,
  CheckSquare,
  Activity,
  AlertOctagon,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { reportsService } from '../../services/reports';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  FilterBar,
  SIFStatusBadge,
  RiskBadge,
  Pagination,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../components/common';
import { cn } from '../../utils/cn';

const DEFAULT_SITES = [
  'Offshore Platform Alpha',
  'Refinery Unit 4',
  'Chemical Terminal B',
  'Petrochemical Complex Gamma',
  'Pipeline Sector 9',
];

export default function ReportsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    site: searchParams.get('site') || '',
    sifStatus: searchParams.get('sifStatus') || '',
    reportType: searchParams.get('reportType') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsService.getReports({
        search: filters.search || undefined,
        site: filters.site || undefined,
        reportType: filters.reportType || undefined,
        page: filters.page,
        limit: 10,
      });

      const reportsList = Array.isArray(res.reports) ? res.reports : Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      setReports(reportsList);
      setPagination(res.pagination || { total: reportsList.length, page: filters.page, limit: 10, totalPages: Math.ceil(reportsList.length / 10) || 1 });
    } catch (err) {
      console.error('Failed to load reports from database:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load safety reports from database');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = (newFilters) => {
    setFilters({ ...newFilters, page: 1 });
    const params = {};
    if (newFilters.search) params.q = newFilters.search;
    if (newFilters.site) params.site = newFilters.site;
    if (newFilters.sifStatus) params.sifStatus = newFilters.sifStatus;
    if (newFilters.reportType) params.reportType = newFilters.reportType;
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      site: '',
      sifStatus: '',
      reportType: '',
      page: 1,
    });
    setSearchParams({});
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Safety Reports"
        description="Comprehensive safety report register and ingestion archive with SIF precursor intelligence."
        badge={`${pagination.total} REPORTS`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={fetchReports}
              title="Refresh Registry"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Upload}
              onClick={() => navigate('/reports/upload')}
            >
              Ingest Report
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        sites={DEFAULT_SITES}
        className="mb-6"
      />

      {/* Main Table Area */}
      {loading ? (
        <LoadingState
          message="Querying Safety Intelligence Archives..."
          subtext="Filtering incidents, extracting SIF precursor metadata, and compiling scores..."
        />
      ) : error ? (
        <ErrorState
          title="Failed to Load Safety Reports"
          message={error}
          onRetry={fetchReports}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No Safety Reports Found"
          description="There are no safety reports matching your search and filter parameters. Try adjusting your query or ingest a new report."
          actionLabel="Ingest Safety Report"
          onAction={() => navigate('/reports/upload')}
        />
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-sm">
              <thead className="bg-surface-container-low border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant select-none">
                <tr>
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Incident Summary</th>
                  <th className="py-3 px-4">Site & Location</th>
                  <th className="py-3 px-4">Activity & Hazard</th>
                  <th className="py-3 px-4">SIF Potential</th>
                  <th className="py-3 px-4 text-center">Scenario Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {reports.map((r) => {
                  const id = r._id || r.id;
                  const reportId = r.reportId || id;
                  const title = r.normalizedReport?.title || r.title || 'Untitled Report';
                  const desc = r.normalizedReport?.description || r.description || '';
                  const site = r.normalizedReport?.site || r.site || 'Global Plant';
                  const location = r.normalizedReport?.location || r.location;
                  const activity = r.normalizedReport?.activity || r.activity || 'Operations';
                  const hazard = r.extractedEntities?.hazard || r.hazard || 'Industrial Hazard';
                  const eventDate = r.normalizedReport?.eventDate || r.eventDate;
                  const dateStr = eventDate ? new Date(eventDate).toLocaleDateString() : 'Recent';
                  const sifStatus = r.sifClassification?.status || r.sifPotential || 'NEEDS_REVIEW';
                  const confidence = r.sifClassification?.confidence || r.confidence;
                  const riskScore = r.riskAssessment?.overallScore || r.riskScore || 50;

                  return (
                    <tr
                      key={id}
                      onClick={() => navigate(`/reports/${id}`)}
                      className="hover:bg-surface-container-low/60 transition-colors cursor-pointer group"
                    >
                      {/* Report ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-primary group-hover:underline whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <span>{reportId}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-on-surface-variant whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-outline" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Incident Summary */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                          {title}
                        </div>
                        <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                          {desc}
                        </p>
                      </td>

                      {/* Site & Location */}
                      <td className="py-3.5 px-4 text-xs text-on-surface whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-outline" />
                          <span>{site}</span>
                        </div>
                        {location && (
                          <span className="text-[11px] text-on-surface-variant ml-4 block truncate max-w-[140px]">
                            {location}
                          </span>
                        )}
                      </td>

                      {/* Activity & Hazard */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-on-surface flex items-center gap-1 truncate max-w-[150px]">
                          <Activity className="w-3 h-3 text-primary-container" />
                          <span>{activity}</span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant block truncate max-w-[150px]">
                          {hazard}
                        </span>
                      </td>

                      {/* SIF Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <SIFStatusBadge status={sifStatus} confidence={confidence} size="xs" />
                      </td>

                      {/* Risk Score */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <RiskBadge score={riskScore} size="xs" />
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={Eye}
                            onClick={() => navigate(`/reports/${id}`)}
                            title="View Full Dossier"
                          >
                            View
                          </Button>
                          <Button
                            variant="secondary"
                            size="xs"
                            icon={CheckSquare}
                            onClick={() => navigate(`/review/${id}`)}
                            title="Open HSE Review Workspace"
                          >
                            Review
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={(p) => setFilters({ ...filters, page: p })}
          />
        </div>
      )}
    </PageContainer>
  );
}
