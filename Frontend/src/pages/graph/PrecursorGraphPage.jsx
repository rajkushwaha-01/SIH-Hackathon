import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  SlidersHorizontal,
  Layers,
  Sparkles,
  ArrowRight,
  Flame,
  Wrench,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  FileText,
  Bot,
  Info,
  RotateCcw,
  Search,
} from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  Input,
  Select,
  RiskBadge,
  SIFStatusBadge,
  Drawer,
} from '../../components/common';
import { cn } from '../../utils/cn';

// Precursor Graph Nodes
const INITIAL_NODES = [
  {
    id: 'n-energy-isolation',
    label: 'Energy Isolation Failure',
    category: 'PRECURSOR',
    group: 'Energy',
    riskScore: 88,
    frequency: 34,
    x: 400,
    y: 220,
    r: 32,
    color: '#ba1a1a',
    description: 'Incomplete isolation or lack of zero-energy verification before opening systems.',
    barriers: ['LOTO Locks', 'Zero Voltage Test', 'Bleed-off Valves'],
    reports: [
      { id: 'INC-2026-002', title: '440V Motor Control Center Arc Flash Near Miss', score: 88 },
      { id: 'INC-1021', title: 'Unverified Energy Isolation Bypass on Line 4', score: 82 },
    ],
  },
  {
    id: 'n-loto-bypass',
    label: 'LOTO Procedure Bypass',
    category: 'BARRIER_FAILURE',
    group: 'Process',
    riskScore: 84,
    frequency: 28,
    x: 230,
    y: 160,
    r: 28,
    color: '#d9381e',
    description: 'Intentional or accidental omission of physical padlocks or tagout tags.',
    barriers: ['Permit to Work', 'Lockout Stations'],
    reports: [
      { id: 'INC-1021', title: 'Unverified Energy Isolation Bypass on Line 4', score: 82 },
    ],
  },
  {
    id: 'n-maintenance',
    label: 'Ad-Hoc Maintenance Task',
    category: 'ACTIVITY',
    group: 'Operations',
    riskScore: 72,
    frequency: 45,
    x: 180,
    y: 330,
    r: 26,
    color: '#0052cc',
    description: 'Non-routine repair, component swap, or emergency mechanical intervention.',
    barriers: ['Toolbox Talk', 'Job Safety Analysis (JSA)'],
    reports: [
      { id: 'INC-2026-001', title: 'Unsecured Scaffolding Planks at 8m Elevation', score: 82 },
    ],
  },
  {
    id: 'n-hydraulic-press',
    label: 'High-Pressure Hydraulic Stored Energy',
    category: 'HAZARD',
    group: 'Energy',
    riskScore: 92,
    frequency: 22,
    x: 580,
    y: 150,
    r: 30,
    color: '#ba1a1a',
    description: 'Accumulated fluid pressure exceeding 1500 PSI in isolated piping runs.',
    barriers: ['Pressure Relief Valves', 'Blast Deflector Shields'],
    reports: [
      { id: 'INC-1021', title: 'Unverified Energy Isolation Bypass on Line 4', score: 82 },
    ],
  },
  {
    id: 'n-line-of-fire',
    label: 'Worker in Line-of-Fire',
    category: 'PRECURSOR',
    group: 'Human',
    riskScore: 85,
    frequency: 31,
    x: 480,
    y: 380,
    r: 28,
    color: '#ba1a1a',
    description: 'Personnel positioned in trajectory of releasing energy, projectile, or falling load.',
    barriers: ['Barricade Tape', 'Exclusion Zones'],
    reports: [
      { id: 'INC-2026-004', title: 'Suspended 4-Ton Heat Exchanger Swing Over Walkway', score: 78 },
    ],
  },
  {
    id: 'n-height-fall',
    label: 'Fall from Height (>2m)',
    category: 'PRECURSOR',
    group: 'Height',
    riskScore: 89,
    frequency: 24,
    x: 680,
    y: 320,
    r: 28,
    color: '#ba1a1a',
    description: 'Elevated platform, scaffolding, or ladder work without continuous anchor connection.',
    barriers: ['100% Dual Lanyard Harness', 'Toe Boards & Guardrails'],
    reports: [
      { id: 'INC-2026-001', title: 'Unsecured Scaffolding Planks at 8m Elevation', score: 82 },
    ],
  },
  {
    id: 'n-scaffold-defect',
    label: 'Degraded Scaffolding Plank',
    category: 'BARRIER_FAILURE',
    group: 'Equipment',
    riskScore: 78,
    frequency: 18,
    x: 760,
    y: 190,
    r: 24,
    color: '#d9381e',
    description: 'Unclipped, warped, or non-scafftagged walking planks on elevated structures.',
    barriers: ['Daily Scafftag Inspection', 'Toe Boards'],
    reports: [
      { id: 'INC-2026-001', title: 'Unsecured Scaffolding Planks at 8m Elevation', score: 82 },
    ],
  },
  {
    id: 'n-sif-event',
    label: 'Critical SIF Outcome (Severe Harm)',
    category: 'CONSEQUENCE',
    group: 'Outcome',
    riskScore: 99,
    frequency: 14,
    x: 640,
    y: 490,
    r: 34,
    color: '#7f0000',
    description: 'High-severity consequence resulting in permanent impairment or fatal exposure.',
    barriers: ['Emergency Shutdown System (ESD)', 'Site Evacuation Protocol'],
    reports: [
      { id: 'INC-2026-002', title: '440V Motor Control Center Arc Flash Near Miss', score: 88 },
      { id: 'INC-2026-005', title: 'Unauthorized Entry into Nitrogen-Purged Reactor Vessel', score: 92 },
    ],
  },
];

const INITIAL_EDGES = [
  { source: 'n-maintenance', target: 'n-loto-bypass', weight: 0.84, label: '0.84 Correl.' },
  { source: 'n-loto-bypass', target: 'n-energy-isolation', weight: 0.92, label: '0.92 Causes' },
  { source: 'n-energy-isolation', target: 'n-hydraulic-press', weight: 0.78, label: '0.78 Releases' },
  { source: 'n-energy-isolation', target: 'n-line-of-fire', weight: 0.81, label: '0.81 Exposes' },
  { source: 'n-hydraulic-press', target: 'n-sif-event', weight: 0.86, label: '0.86 SIF Link' },
  { source: 'n-line-of-fire', target: 'n-sif-event', weight: 0.89, label: '0.89 SIF Link' },
  { source: 'n-scaffold-defect', target: 'n-height-fall', weight: 0.87, label: '0.87 Initiates' },
  { source: 'n-height-fall', target: 'n-sif-event', weight: 0.94, label: '0.94 SIF Link' },
  { source: 'n-maintenance', target: 'n-height-fall', weight: 0.65, label: '0.65 Context' },
];

export default function PrecursorGraphPage() {
  const navigate = useNavigate();

  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);

  const [selectedNode, setSelectedNode] = useState(INITIAL_NODES[0]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [minWeight, setMinWeight] = useState(0.5);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Filtered Edges based on threshold
  const filteredEdges = useMemo(() => {
    return edges.filter((e) => e.weight >= minWeight);
  }, [edges, minWeight]);

  // Find connected node IDs for highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set();
    const set = new Set([selectedNode.id]);
    filteredEdges.forEach((e) => {
      if (e.source === selectedNode.id) set.add(e.target);
      if (e.target === selectedNode.id) set.add(e.source);
    });
    return set;
  }, [selectedNode, filteredEdges]);

  // Node position map
  const nodeMap = useMemo(() => {
    const map = new Map();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const handleZoom = (delta) => {
    setZoomLevel((prev) => Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.6), 2.0));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedNode(INITIAL_NODES[0]);
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="SIF Precursor Relationship Graph"
        description="Interactive causal relationship graph mapping multi-stage precursor pathways to high-severity outcomes."
        badge="WOW FEATURE #1"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              icon={RotateCcw}
              onClick={handleResetView}
            >
              Reset Canvas
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={SlidersHorizontal}
              onClick={() => navigate(`/risk-simulator?precursor=${encodeURIComponent(selectedNode?.label || '')}`)}
            >
              Simulate in What-If
            </Button>
          </div>
        }
      />

      {/* Control Filter Ribbon */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3.5 shadow-subtle mb-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search graph nodes..."
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-on-surface-variant uppercase">Group:</span>
          <div className="flex flex-wrap gap-1">
            {['ALL', 'Energy', 'Height', 'Process', 'Human', 'Outcome'].map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-semibold transition-all',
                  selectedGroup === grp
                    ? 'bg-primary text-white shadow-xs font-bold'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                )}
              >
                {grp}
              </button>
            ))}
          </div>
        </div>

        {/* Correlation Weight Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-on-surface-variant uppercase whitespace-nowrap">
            Min Strength: <span className="font-mono text-primary">{minWeight.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min="0.5"
            max="0.95"
            step="0.05"
            value={minWeight}
            onChange={(e) => setMinWeight(parseFloat(e.target.value))}
            className="w-28 accent-primary h-1.5 bg-surface-container-high rounded cursor-pointer"
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded border border-outline-variant">
          <button
            onClick={() => handleZoom(-0.15)}
            className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-bold px-1.5 text-on-surface">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.15)}
            className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas + Side Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: SVG Network Visualization Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-subtle overflow-hidden relative h-[620px] flex flex-col justify-between select-none">
          {/* Canvas Background Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#c3c6d6_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

          {/* Interactive SVG Diagram */}
          <svg
            className="w-full h-full cursor-grab active:cursor-grabbing"
            viewBox="0 0 950 620"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
          >
            <defs>
              <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#003d9b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ba1a1a" stopOpacity="0.9" />
              </linearGradient>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Edges / Connections */}
            {filteredEdges.map((edge, idx) => {
              const src = nodeMap.get(edge.source);
              const tgt = nodeMap.get(edge.target);
              if (!src || !tgt) return null;

              const isHighlighted =
                selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
              const isDimmed = selectedNode && !isHighlighted;

              const midX = (src.x + tgt.x) / 2;
              const midY = (src.y + tgt.y) / 2;

              return (
                <g key={idx} className="transition-opacity duration-300" opacity={isDimmed ? 0.15 : 1}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isHighlighted ? '#003d9b' : '#c3c6d6'}
                    strokeWidth={isHighlighted ? 3.5 : 1.5}
                    strokeDasharray={edge.weight < 0.75 ? '4 3' : 'none'}
                    className={isHighlighted ? 'animate-pulse' : ''}
                  />
                  {/* Correlation Weight Chip */}
                  <rect
                    x={midX - 22}
                    y={midY - 9}
                    width={44}
                    height={18}
                    rx={4}
                    fill="#ffffff"
                    stroke={isHighlighted ? '#003d9b' : '#c3c6d6'}
                    strokeWidth={1}
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    textAnchor="middle"
                    fill={isHighlighted ? '#003d9b' : '#737685'}
                    fontSize="9px"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {(edge.weight * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isConnected = connectedNodeIds.has(node.id);
              const isDimmed = selectedNode && !isConnected && !isSelected;

              // Filter by group or search
              if (selectedGroup !== 'ALL' && node.group !== selectedGroup) return null;
              if (
                searchQuery &&
                !node.label.toLowerCase().includes(searchQuery.toLowerCase())
              )
                return null;

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="cursor-pointer transition-all duration-200"
                  opacity={isDimmed ? 0.2 : 1}
                >
                  {/* Outer Pulsing Ring for Selected Node */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r + 8}
                      fill="none"
                      stroke={node.color}
                      strokeWidth={2.5}
                      strokeDasharray="4 3"
                      className="animate-spin"
                      style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill={node.color}
                    stroke="#ffffff"
                    strokeWidth={3}
                    filter={isSelected ? 'url(#glow)' : undefined}
                    className="hover:scale-110 transition-transform duration-150"
                  />

                  {/* Inner Score Readout */}
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11px"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                  >
                    {node.riskScore}
                  </text>

                  {/* Node Label Below */}
                  <text
                    x={node.x}
                    y={node.y + node.r + 14}
                    textAnchor="middle"
                    fill="#191b23"
                    fontSize="11px"
                    fontFamily="sans-serif"
                    fontWeight={isSelected ? 'bold' : '600'}
                    className="select-none"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Graph Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 backdrop-blur-xs border border-outline-variant p-2.5 rounded-lg shadow-xs flex items-center gap-3 text-[11px] text-on-surface">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]" />
              <span>SIF Precursor</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d9381e]" />
              <span>Barrier Failure</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0052cc]" />
              <span>Activity</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7f0000]" />
              <span>SIF Outcome</span>
            </div>
          </div>
        </div>

        {/* Right: Side Inspector Panel / Node Dossier (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-subtle p-5 flex flex-col justify-between max-h-[620px] overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="pb-3 border-b border-outline-variant/60">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-fixed-dim text-primary">
                    {selectedNode.category}
                  </span>
                  <RiskBadge score={selectedNode.riskScore} size="xs" />
                </div>
                <h3 className="text-lg font-bold text-on-surface leading-tight mt-1">
                  {selectedNode.label}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface-container-low p-2.5 rounded border border-outline-variant text-center">
                  <span className="text-[10px] uppercase font-bold text-outline block">Reports Count</span>
                  <span className="text-lg font-bold font-mono text-on-surface">{selectedNode.frequency}</span>
                </div>
                <div className="bg-surface-container-low p-2.5 rounded border border-outline-variant text-center">
                  <span className="text-[10px] uppercase font-bold text-outline block">Precursor Risk</span>
                  <span className="text-lg font-bold font-mono text-error">{selectedNode.riskScore} / 100</span>
                </div>
              </div>

              {/* Related Defense Barriers */}
              {selectedNode.barriers && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-2 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-error" />
                    <span>Critical Barriers Associated</span>
                  </h4>
                  <ul className="space-y-1">
                    {selectedNode.barriers.map((bar, i) => (
                      <li key={i} className="text-xs p-2 rounded bg-surface-container border border-outline-variant/60 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                        <span className="font-medium text-on-surface">{bar}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Associated Reports */}
              {selectedNode.reports && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-2 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>Contributing Safety Incidents</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedNode.reports.map((rep) => (
                      <div
                        key={rep.id}
                        onClick={() => navigate(`/reports/${rep.id}`)}
                        className="p-2.5 rounded border border-outline-variant hover:border-primary transition-all cursor-pointer bg-surface-container-lowest hover:bg-surface-container-low text-xs group"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono font-bold text-primary group-hover:underline">{rep.id}</span>
                          <span className="font-mono text-[10px] text-error font-bold">{rep.score} pts</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate">{rep.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-outline-variant/60 space-y-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full font-bold shadow-sm"
                  icon={SlidersHorizontal}
                  onClick={() => navigate(`/risk-simulator?precursor=${encodeURIComponent(selectedNode.label)}`)}
                >
                  Run What-If Simulation
                </Button>

                <Button
                  variant="accent"
                  size="sm"
                  className="w-full text-xs"
                  icon={Bot}
                  onClick={() => navigate(`/copilot?q=Explain+causal+pathway+for+precursor+${encodeURIComponent(selectedNode.label)}`)}
                >
                  Ask Copilot About Pathway
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-outline">
              Click on any node in the causal graph to inspect risk pathways and barrier correlations.
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
