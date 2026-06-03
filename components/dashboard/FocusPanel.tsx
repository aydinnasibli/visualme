'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  ZoomIn, ZoomOut, RotateCcw, Share2, CheckCircle,
  Pencil, Sparkles, X, Download, ImageIcon, Code2,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  NetworkGraphData, MindMapData, TreeDiagramData,
  TimelineData, GanttChartData, AnimatedTimelineData,
  FlowchartData, SankeyDiagramData, SwimlaneDiagramData,
  LineChartData, BarChartData, ScatterPlotData,
  HeatmapData, RadarChartData, PieChartData,
  ComparisonTableData, ParallelCoordinatesData,
  WordCloudData, SyntaxDiagramData,
  MindMapNode,
} from '@/lib/types/visualization';
import type { NetworkGraphHandle } from '@/components/visualizations/NetworkGraph';
import type { MindMapHandle } from '@/components/visualizations/MindMap';
import type { FlowchartHandle } from '@/components/visualizations/Flowchart';
import type { ThreadEntry } from '@/components/dashboard/VizThread';
import { TYPE_META } from '@/components/dashboard/VizThread';
import EditPanel from '@/components/dashboard/EditPanel';

/* ── Lazy viz loaders ── */
const VizLoader = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin" />
  </div>
);
const dyn = (imp: () => Promise<{ default: React.ComponentType<any> }>) =>
  dynamic(imp, { ssr: false, loading: VizLoader });

const DynNetworkGraph      = dyn(() => import('@/components/visualizations/NetworkGraph'));
const DynMindMap           = dyn(() => import('@/components/visualizations/MindMap'));
const DynTreeDiagram       = dyn(() => import('@/components/visualizations/TreeDiagram'));
const DynTimeline          = dyn(() => import('@/components/visualizations/Timeline'));
const DynGanttChart        = dyn(() => import('@/components/visualizations/GanttChart'));
const DynAnimatedTimeline  = dyn(() => import('@/components/visualizations/AnimatedTimeline'));
const DynFlowchart         = dyn(() => import('@/components/visualizations/Flowchart'));
const DynSankeyDiagram     = dyn(() => import('@/components/visualizations/SankeyDiagram'));
const DynSwimlaneDiagram   = dyn(() => import('@/components/visualizations/SwimlaneDiagram'));
const DynLineChart         = dyn(() => import('@/components/visualizations/LineChart'));
const DynBarChart          = dyn(() => import('@/components/visualizations/BarChart'));
const DynScatterPlot       = dyn(() => import('@/components/visualizations/ScatterPlot'));
const DynHeatmap           = dyn(() => import('@/components/visualizations/Heatmap'));
const DynRadarChart        = dyn(() => import('@/components/visualizations/RadarChart'));
const DynPieChart          = dyn(() => import('@/components/visualizations/PieChart'));
const DynComparisonTable   = dyn(() => import('@/components/visualizations/ComparisonTable'));
const DynParallelCoords    = dyn(() => import('@/components/visualizations/ParallelCoordinates'));
const DynWordCloud         = dyn(() => import('@/components/visualizations/WordCloud'));
const DynSyntaxDiagram     = dyn(() => import('@/components/visualizations/SyntaxDiagram'));

const ZOOMABLE = new Set(['network_graph', 'mind_map', 'tree_diagram', 'flowchart', 'sankey_diagram', 'swimlane_diagram']);

/* ── Header action button ── */
function ActionBtn({
  onClick, title, children, variant = 'default', active,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger';
  active?: boolean;
}) {
  const colors = {
    default: { base: '#3f3f46', hover: '#d4d4d8', bg: 'transparent', bgHover: 'rgba(255,255,255,0.08)' },
    success: { base: '#34d399', hover: '#6ee7b7', bg: 'rgba(52,211,153,0.08)', bgHover: 'rgba(52,211,153,0.15)' },
    danger:  { base: '#f87171', hover: '#fca5a5', bg: 'transparent', bgHover: 'rgba(239,68,68,0.1)' },
  }[variant];

  return (
    <button
      title={title}
      onClick={onClick}
      className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] font-medium transition-all duration-150"
      style={{ color: active ? colors.hover : colors.base, background: active ? colors.bg : colors.bg }}
      onMouseEnter={e => {
        e.currentTarget.style.color = colors.hover;
        e.currentTarget.style.background = colors.bgHover;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = active ? colors.hover : colors.base;
        e.currentTarget.style.background = active ? colors.bg : colors.bg;
      }}
    >
      {children}
    </button>
  );
}

function ZoomBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08]"
    >
      {children}
    </button>
  );
}

/* ── Empty state ── */
function EmptyFocus() {
  return (
    <div className="w-full h-full flex items-center justify-center select-none">
      <div className="flex flex-col items-center gap-5 opacity-40">
        <div className="relative w-40 h-28">
          {[
            { x: 0, y: 0, w: '55%', h: '48%', color: '#8b5cf6' },
            { x: '45%', y: 0, w: '55%', h: '48%', color: '#06b6d4' },
            { x: 0, y: '52%', w: '35%', h: '48%', color: '#10b981' },
            { x: '38%', y: '52%', w: '62%', h: '48%', color: '#f59e0b' },
          ].map((c, i) => (
            <div
              key={i}
              className="absolute rounded-lg border"
              style={{
                left: c.x, top: c.y, width: c.w, height: c.h,
                borderColor: `${c.color}35`, background: `${c.color}07`,
              }}
            >
              <div className="h-[5px] rounded-t-lg" style={{ background: `${c.color}28` }} />
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-zinc-400">Select a visualization</p>
          <p className="text-xs text-zinc-600 mt-1">Click any item in the thread to view it here</p>
        </div>
      </div>
    </div>
  );
}

/* ── Props ── */
export interface FocusPanelProps {
  thread: ThreadEntry | null;
  saving: boolean;
  onSave: () => void;
  onShare: () => void;
  onExpand: (nodeId: string, nodeLabel: string) => Promise<void>;
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date | string }>;
  handleChatMessage: (message: string) => Promise<void>;
  isEditing: boolean;
  manualEditJson: string;
  setManualEditJson: (json: string) => void;
  handleManualEdit: () => void;
}

export default function FocusPanel({
  thread, saving, onSave, onShare, onExpand,
  chatHistory, handleChatMessage, isEditing,
  manualEditJson, setManualEditJson, handleManualEdit,
}: FocusPanelProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!exportOpen) return;
    const close = () => setExportOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [exportOpen]);

  const networkRef   = useRef<NetworkGraphHandle | null>(null);
  const mindMapRef   = useRef<MindMapHandle | null>(null);
  const flowchartRef = useRef<FlowchartHandle | null>(null);
  const vizAreaRef   = useRef<HTMLDivElement | null>(null);

  const safeTitle = (t: ThreadEntry) =>
    t.title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 60) || 'visualization';

  const handleExportPNG = useCallback(async () => {
    if (!vizAreaRef.current || !thread) return;
    setExporting(true);
    setExportOpen(false);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(vizAreaRef.current, {
        backgroundColor: '#0a0d11',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${safeTitle(thread)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Exported as PNG');
    } catch {
      toast.error('PNG export failed');
    } finally {
      setExporting(false);
    }
  }, [thread]);

  const handleExportSVG = useCallback(() => {
    if (!vizAreaRef.current || !thread) return;
    setExportOpen(false);
    const svg = vizAreaRef.current.querySelector('svg');
    if (!svg) {
      toast.error('SVG not available for this type — try PNG instead');
      return;
    }
    const clone = svg.cloneNode(true) as SVGElement;
    if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${safeTitle(thread)}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as SVG');
  }, [thread]);

  const handleZoomIn  = useCallback(() => {
    if (!thread) return;
    if (thread.type === 'network_graph') networkRef.current?.zoomIn();
    if (thread.type === 'mind_map')     mindMapRef.current?.zoomIn();
    if (thread.type === 'flowchart')    flowchartRef.current?.zoomIn();
  }, [thread]);

  const handleZoomOut = useCallback(() => {
    if (!thread) return;
    if (thread.type === 'network_graph') networkRef.current?.zoomOut();
    if (thread.type === 'mind_map')     mindMapRef.current?.zoomOut();
    if (thread.type === 'flowchart')    flowchartRef.current?.zoomOut();
  }, [thread]);

  const handleFit = useCallback(() => {
    if (!thread) return;
    if (thread.type === 'network_graph') networkRef.current?.fit();
    if (thread.type === 'mind_map')     mindMapRef.current?.fitView();
    if (thread.type === 'flowchart')    flowchartRef.current?.fit();
  }, [thread]);

  /* ── Render viz ── */
  const renderViz = useCallback((t: ThreadEntry) => {
    const exp = (nId: string, nLabel: string) => onExpand(nId, nLabel);
    switch (t.type) {
      case 'network_graph':
        return (
          <DynNetworkGraph
            ref={(h: NetworkGraphHandle | null) => { networkRef.current = h; }}
            data={t.data as NetworkGraphData}
            onExpand={exp}
            visualizationKey={t.id}
          />
        );
      case 'mind_map':
        return (
          <DynMindMap
            ref={(h: MindMapHandle | null) => { mindMapRef.current = h; }}
            data={t.data as MindMapData}
            onExpand={exp}
          />
        );
      case 'tree_diagram':    return <DynTreeDiagram data={t.data as TreeDiagramData} onExpand={exp} />;
      case 'timeline':        return <DynTimeline data={t.data as TimelineData} />;
      case 'gantt_chart':     return <DynGanttChart data={t.data as GanttChartData} />;
      case 'animated_timeline': return <DynAnimatedTimeline data={t.data as AnimatedTimelineData} />;
      case 'flowchart':
        return (
          <DynFlowchart
            ref={(h: FlowchartHandle | null) => { flowchartRef.current = h; }}
            data={t.data as FlowchartData}
          />
        );
      case 'sankey_diagram':   return <DynSankeyDiagram data={t.data as SankeyDiagramData} />;
      case 'swimlane_diagram': return <DynSwimlaneDiagram data={t.data as SwimlaneDiagramData} />;
      case 'line_chart':       return <DynLineChart data={t.data as LineChartData} />;
      case 'bar_chart':        return <DynBarChart data={t.data as BarChartData} />;
      case 'scatter_plot':     return <DynScatterPlot data={t.data as ScatterPlotData} />;
      case 'heatmap':          return <DynHeatmap data={t.data as HeatmapData} />;
      case 'radar_chart':      return <DynRadarChart data={t.data as RadarChartData} />;
      case 'pie_chart':        return <DynPieChart data={t.data as PieChartData} />;
      case 'comparison_table': return <DynComparisonTable data={t.data as ComparisonTableData} />;
      case 'parallel_coordinates': return <DynParallelCoords data={t.data as ParallelCoordinatesData} />;
      case 'word_cloud':       return <DynWordCloud data={t.data as WordCloudData} />;
      case 'syntax_diagram':   return <DynSyntaxDiagram data={t.data as SyntaxDiagramData} />;
      default:
        return <div className="flex items-center justify-center h-full text-zinc-600 text-sm">Unknown type</div>;
    }
  }, [onExpand]);

  if (!thread) {
    return (
      <div className="w-full h-full" style={{ background: '#0a0d11' }}>
        <EmptyFocus />
      </div>
    );
  }

  const meta = TYPE_META[thread.type] ?? { icon: '📊', color: '#6366f1', label: thread.type };
  const canZoom = ZOOMABLE.has(thread.type);

  return (
    <div className="w-full h-full flex" style={{ background: '#0a0d11' }}>
      {/* ── Main viz area ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-4 h-12 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}
        >
          {/* Type badge */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md"
            style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}25` }}
          >
            <span className="text-sm leading-none">{meta.icon}</span>
            <span className="text-[11px] font-semibold" style={{ color: meta.color }}>{meta.label}</span>
          </div>

          {/* Title */}
          <h2 className="text-sm font-semibold text-zinc-300 truncate flex-1" title={thread.title}>
            {thread.title}
          </h2>

          {/* Zoom controls */}
          {canZoom && (
            <div className="flex items-center gap-0.5">
              <ZoomBtn title="Zoom out" onClick={handleZoomOut}><ZoomOut size={14} /></ZoomBtn>
              <ZoomBtn title="Fit view" onClick={handleFit}><RotateCcw size={13} /></ZoomBtn>
              <ZoomBtn title="Zoom in" onClick={handleZoomIn}><ZoomIn size={14} /></ZoomBtn>
              <div className="w-px h-4 bg-white/10 mx-1" />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1">
            <ActionBtn
              title={thread.isSaved ? 'Saved' : 'Save visualization'}
              onClick={saving ? () => {} : onSave}
              variant={thread.isSaved ? 'success' : 'default'}
              active={thread.isSaved}
            >
              {saving
                ? <div className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                : <CheckCircle size={13} />
              }
              <span>{thread.isSaved ? 'Saved' : 'Save'}</span>
            </ActionBtn>

            <ActionBtn title="Share (copy link)" onClick={onShare}>
              <Share2 size={13} />
              <span>Share</span>
            </ActionBtn>

            {/* Export dropdown */}
            <div className="relative">
              <ActionBtn
                title="Export"
                onClick={() => setExportOpen(p => !p)}
                active={exportOpen}
              >
                {exporting
                  ? <div className="w-3 h-3 border-2 border-zinc-400/30 border-t-zinc-300 rounded-full animate-spin" />
                  : <Download size={13} />
                }
                <span>Export</span>
              </ActionBtn>
              <AnimatePresence>
                {exportOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.13 }}
                    className="absolute right-0 top-full mt-1.5 w-40 rounded-xl overflow-hidden z-50"
                    style={{ background: '#131b26', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
                  >
                    <button
                      onClick={handleExportPNG}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.07] hover:text-white transition-colors"
                    >
                      <ImageIcon size={13} className="text-blue-400" />
                      Export as PNG
                    </button>
                    <button
                      onClick={handleExportSVG}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.07] hover:text-white transition-colors"
                    >
                      <Code2 size={13} className="text-violet-400" />
                      Export as SVG
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-4 bg-white/10 mx-0.5" />

            <ActionBtn
              title="Refine with AI"
              onClick={() => setEditOpen(p => !p)}
              active={editOpen}
            >
              <Pencil size={12} />
              <span>Refine</span>
            </ActionBtn>
          </div>
        </div>

        {/* Viz */}
        <div ref={vizAreaRef} className="flex-1 relative overflow-hidden min-h-0" key={thread.id}>
          {renderViz(thread)}
        </div>
      </div>

      {/* ── Edit panel (slide in from right) ── */}
      <AnimatePresence>
        {editOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex-shrink-0 overflow-hidden relative"
            style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-[380px] h-full flex flex-col" style={{ background: '#0f1419' }}>
              {/* Edit panel header */}
              <div
                className="flex items-center justify-between px-4 h-12 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400/70" />
                  <span className="text-xs font-semibold text-zinc-400">Refine</span>
                </div>
                <button
                  onClick={() => setEditOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Edit panel body */}
              <div className="flex-1 overflow-hidden min-h-0 relative">
                <EditPanel
                  chatHistory={chatHistory}
                  handleChatMessage={handleChatMessage}
                  isEditing={isEditing}
                  manualEditJson={manualEditJson}
                  setManualEditJson={setManualEditJson}
                  handleManualEdit={handleManualEdit}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
