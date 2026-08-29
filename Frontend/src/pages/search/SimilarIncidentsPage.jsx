import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
  ExternalLink,
  Bot,
  Flame,
  Wrench,
  AlertTriangle,
  RefreshCw,
  Layers,
  MapPin,
  Calendar,
} from 'lucide-react';
import { searchService } from '../../services/search';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  Input,
  Select,
  EvidenceCard,
  RiskBadge,
  SIFStatusBadge,
  LoadingState,
  EmptyState,
} from '../../components/common';
import { cn } from '../../utils/cn';

const SAMPLE_QUERIES = [
  'H2S toxic gas release during line breaking',
  '440V electrical LOTO bypass and arc flash',
  'Scaffolding plank shift and fall from height',
  'Suspended crane load swing over pedestrian walkway',
  'Nitrogen purged vessel unauthorized entry',
];

const SITES = [
  'All Sites',
  'Offshore Platform Alpha',
  'Refinery Unit 4',
  'Chemical Terminal B',
  'Petrochemical Complex Gamma',
  'Pipeline Sector 9',
];

export default function SimilarIncidentsPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('H2S toxic gas release during line breaking');
  const [minThreshold, setMinThreshold] = useState(0.65);
  const [selectedSite, setSelectedSite] = useState('All Sites');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const executeSearch = async (queryString = query) => {
    if (!queryString.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const payload = {
        query: queryString.trim(),
        minScore: minThreshold,
        topK: 10,
        filters: selectedSite !== 'All Sites' ? { site: selectedSite } : {},
      };

      const res = await searchService.semanticSearch(payload);
      const resultsList = res?.results || res?.data?.results || (Array.isArray(res) ? res : []);
      setResults(resultsList);
    } catch (err) {
      console.error('Vector search error:', err);
      setError(err?.response?.data?.message || err?.message || 'Semantic vector search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [minThreshold, selectedSite]);

  const handleQuerySubmit = (e) => {
    e.preventDefault();
    executeSearch();
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Similar Incident Search"
        description="Query the enterprise Pinecone vector database using natural language concepts to uncover correlated precursor precedents."
        badge="VECTOR SEMANTIC SEARCH"
      />

      {/* Main Search Bar Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-subtle mb-6">
        <form onSubmit={handleQuerySubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Describe a safety hazard, near-miss event, or precursor concept in natural language..."
                icon={Search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-base py-3"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              icon={Sparkles}
              className="shrink-0 font-bold shadow-sm"
            >
              Vector Search
            </Button>
          </div>

          {/* Quick Query Suggestions Ribbon */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
              <Bookmark className="w-3.5 h-3.5 text-primary-container" />
              <span>Suggested Queries:</span>
            </span>
            {SAMPLE_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(sample);
                  executeSearch(sample);
                }}
                className="text-xs px-2.5 py-1 rounded bg-surface-container-low border border-outline-variant hover:border-primary-container text-on-surface hover:text-primary transition-all font-medium"
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Search Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-outline-variant/60">
            {/* Site Facet */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Facility Filter:
              </span>
              <div className="w-48">
                <Select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  options={SITES.map((s) => ({ value: s, label: s }))}
                />
              </div>
            </div>

            {/* Threshold Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant whitespace-nowrap">
                Match Threshold: <span className="font-mono text-primary font-bold">{Math.round(minThreshold * 100)}%</span>
              </span>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseFloat(e.target.value))}
                className="w-32 accent-primary h-1.5 bg-surface-container-high rounded cursor-pointer"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-on-surface">
            {searched ? `Found ${results.length} Semantically Correlated Incidents` : 'Semantic Match Results'}
          </h3>
          <p className="text-xs text-on-surface-variant">
            Ranked by high-dimensional embedding similarity in Pinecone index
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={Bot}
          onClick={() => navigate(`/copilot?q=Summarize+patterns+in+incidents+similar+to:+${encodeURIComponent(query)}`)}
        >
          Synthesize in Copilot
        </Button>
      </div>

      {/* Results Stream */}
      {loading ? (
        <LoadingState
          message="Executing Vector Semantic Search..."
          subtext="Transforming query into 768-dimensional embeddings and querying Pinecone indexes..."
        />
      ) : results.length === 0 ? (
        <EmptyState
          title="No Matching Incidents Found"
          description="Try lowering the similarity threshold or adjust your query terms to discover broader historical precedents."
          actionLabel="Reset Threshold to 50%"
          onAction={() => setMinThreshold(0.5)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((item, idx) => (
            <EvidenceCard
              key={idx}
              reportId={item.reportId || item.id}
              title={item.title}
              text={item.text || item.description}
              site={item.site}
              similarity={item.similarity || item.score}
              riskScore={item.riskScore}
              sifPotential={item.sifPotential}
              factors={item.factors}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
