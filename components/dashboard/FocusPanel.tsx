'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, CheckCircle, BarChart3, LineChart, PieChart, ScatterChart,
  Sparkle, CandlestickChart, AlignEndHorizontal, BoxSelect, Grid3x3,
  Radar, AlignVerticalSpaceAround, Gauge, Filter, Waves, GitBranch,
  LayoutGrid, CircleDot, Workflow,
  Pencil, Sparkles, X, Download, ImageIcon,
  Globe, FileJson, FileSpreadsheet, FileCode, FileText, Zap,
  Rss, RefreshCw, Clock, Unlink,
} from 'lucide-react';
import type { ElementType } from 'react';
import { toast } from 'sonner';

/* ── Series type → icon + label ── */
const SERIES_ICON: Record<string, ElementType> = {
  bar: BarChart3, line: LineChart, pie: PieChart, scatter: ScatterChart,
  effectScatter: Sparkle, candlestick: CandlestickChart, pictorialBar: AlignEndHorizontal,
  boxplot: BoxSelect, heatmap: Grid3x3, radar: Radar, parallel: AlignVerticalSpaceAround,
  gauge: Gauge, funnel: Filter, themeRiver: Waves, graph: Share2,
  tree: GitBranch, treemap: LayoutGrid, sunburst: CircleDot, sankey: Workflow,
};
const SERIES_LABEL: Record<string, string> = {
  bar: 'Bar Chart', line: 'Line Chart', pie: 'Pie Chart', scatter: 'Scatter Plot',
  effectScatter: 'Effect Scatter', candlestick: 'Candlestick', pictorialBar: 'Pictorial Bar',
  boxplot: 'Box Plot', heatmap: 'Heatmap', radar: 'Radar Chart', parallel: 'Parallel Coords',
  gauge: 'Gauge', funnel: 'Funnel', themeRiver: 'Theme River', graph: 'Network Graph',
  tree: 'Tree', treemap: 'Treemap', sunburst: 'Sunburst', sankey: 'Sankey',
};
import type { ThreadEntry } from '@/components/dashboard/VizThread';
import { VisualizationErrorBoundary } from '@/components/VisualizationErrorBoundary';
import EditPanel from '@/components/dashboard/EditPanel';
import EChartsRenderer from '@/components/visualizations/EChartsRenderer';
import { exportCanvasAsPNG } from '@/lib/utils/export-png';
import { exportChartAsPDF } from '@/lib/utils/export-dashboard';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import type { BrandTheme } from '@/lib/types/echarts-spec';
import { DEFAULT_SUNSET_THEME } from '@/lib/types/echarts-spec';

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
    default: { base: 'var(--color-ink-faint)', hover: 'var(--color-ink)', bg: 'transparent', bgActive: 'var(--color-surface-3)' },
    success: { base: 'var(--color-success)', hover: 'var(--color-success)', bg: 'oklch(73% 0.14 152 / 0.08)', bgActive: 'oklch(73% 0.14 152 / 0.15)' },
    danger:  { base: 'var(--color-danger)', hover: 'var(--color-danger)', bg: 'transparent', bgActive: 'oklch(64% 0.19 23 / 0.1)' },
  }[variant];

  return (
    <button
      title={title}
      onClick={onClick}
      className="h-7 px-2 sm:px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] font-medium transition-all duration-150"
      style={{ color: active ? colors.hover : colors.base, background: active ? colors.bgActive : colors.bg }}
      onMouseEnter={e => {
        e.currentTarget.style.color = colors.hover;
        e.currentTarget.style.background = colors.bgActive;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = active ? colors.hover : colors.base;
        e.currentTarget.style.background = active ? colors.bgActive : colors.bg;
      }}
    >
      {children}
    </button>
  );
}

/* ── Empty state ── */
function EmptyFocus() {
  return (
    <div className="w-full h-full flex items-center justify-center select-none">
      <div className="flex flex-col items-center gap-5 opacity-50">
        <div className="relative w-40 h-28">
          {[
            { x: 0, y: 0, w: '55%', h: '48%' },
            { x: '45%', y: 0, w: '55%', h: '48%' },
            { x: 0, y: '52%', w: '35%', h: '48%' },
            { x: '38%', y: '52%', w: '62%', h: '48%' },
          ].map((c, i) => (
            <div
              key={i}
              className="absolute rounded-lg border border-edge bg-surface-2"
              style={{ left: c.x, top: c.y, width: c.w, height: c.h }}
            >
              <div className="h-[5px] rounded-t-lg bg-surface-3" />
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-ink-muted">Select a visualization</p>
          <p className="text-xs text-ink-faint mt-1">Click any item in the thread to view it here</p>
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
  onExportData: (format: 'json' | 'csv' | 'html') => Promise<void>;
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date | string }>;
  handleChatMessage: (message: string) => Promise<void>;
  isEditing: boolean;
  onThemeChange: (theme: BrandTheme) => void;
  onTitleChange?: (title: string) => void;
  onLiveDataChange?: (config: { url: string; interval: number } | null) => void;
  onRefreshLiveData?: () => Promise<void>;
  isRefreshing?: boolean;
}

const INTERVAL_OPTIONS = [
  { label: 'Manual', value: 0 },
  { label: 'Every hour', value: 60 },
  { label: 'Every 6h', value: 360 },
  { label: 'Daily', value: 1440 },
] as const;

export default function FocusPanel({
  thread, saving, onSave, onShare, onExportData,
  chatHistory, handleChatMessage, isEditing,
  onThemeChange, onTitleChange,
  onLiveDataChange, onRefreshLiveData, isRefreshing,
}: FocusPanelProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [exporting, setExporting] = useState(false);
  const [liveInterval, setLiveInterval] = useState(0);
  const exportRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  /* Below `sm`, the Refine panel becomes a full-screen overlay */
  const isMobile = useMediaQuery('(max-width: 639px)');

  /* Close export dropdown only when clicking outside it */
  useEffect(() => {
    if (!exportOpen) return;
    const close = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [exportOpen]);

  /* Close live panel when clicking outside */
  useEffect(() => {
    if (!liveOpen) return;
    const close = (e: MouseEvent) => {
      if (!liveRef.current?.contains(e.target as Node)) setLiveOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [liveOpen]);

  /* Sync URL input and reset inline title editor whenever the active thread changes */
  const [prevThreadId, setPrevThreadId] = useState(thread?.id);
  if (thread?.id !== prevThreadId) {
    setPrevThreadId(thread?.id);
    setLiveInterval(thread?.liveData?.interval ?? 0);
    setLiveOpen(false);
    setEditingTitle(false);
    setEditTitleValue('');
  }

  const vizAreaRef = useRef<HTMLDivElement | null>(null);

  const safeTitle = (t: ThreadEntry) =>
    t.title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 60) || 'visualization';

  const handleExportPNG = useCallback(async () => {
    if (!vizAreaRef.current || !thread) return;
    setExporting(true);
    setExportOpen(false);
    try {
      const ok = exportCanvasAsPNG(vizAreaRef.current, `${safeTitle(thread)}.png`);
      if (!ok) { toast.error('No chart canvas found'); return; }
      toast.success('Exported as PNG');
    } catch {
      toast.error('PNG export failed');
    } finally {
      setExporting(false);
    }
  }, [thread]);

  const handleExportPDF = useCallback(() => {
    if (!vizAreaRef.current || !thread) return;
    setExportOpen(false);
    try {
      const ok = exportChartAsPDF(vizAreaRef.current, thread.title);
      if (!ok) { toast.error('No chart canvas found'); return; }
      toast.success('Exported as PDF');
    } catch {
      toast.error('PDF export failed');
    }
  }, [thread]);

  /* ── Render viz ── */
  const renderViz = useCallback((t: ThreadEntry) => {
    return <EChartsRenderer spec={t.spec} className="w-full h-full p-6" />;
  }, []);

  if (!thread) {
    return (
      <div className="w-full h-full bg-surface-0">
        <EmptyFocus />
      </div>
    );
  }

  /* ── Series type badge — thread is guaranteed non-null beyond this point ── */
  const s = thread.spec.option.series;
  const seriesType = s
    ? ((Array.isArray(s) ? s[0] : s) as Record<string, unknown>)?.type as string | undefined
    : undefined;
  const BadgeIcon: ElementType = (seriesType ? SERIES_ICON[seriesType] : undefined) ?? BarChart3;
  const badgeLabel = (seriesType ? SERIES_LABEL[seriesType] : undefined)
    ?? (seriesType ? seriesType.charAt(0).toUpperCase() + seriesType.slice(1) : 'Chart');

  /* ── Resolved theme — fallback guards against old DB specs with no theme field ── */
  const resolvedTheme = thread.spec.theme ?? DEFAULT_SUNSET_THEME;

  return (
    <div className="w-full h-full flex bg-surface-0">
      {/* ── Main viz area ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 h-12 shrink-0 border-b border-edge bg-surface-1">
          {/* Type badge — derived from the actual series type in the spec */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md shrink-0"
            style={{ background: 'oklch(72% 0.13 55 / 0.08)', border: '1px solid oklch(72% 0.13 55 / 0.18)' }}
          >
            <BadgeIcon size={12} className="text-accent" />
            <span className="hidden sm:inline text-[11px] font-semibold text-accent">{badgeLabel}</span>
          </div>

          {/* Title — click to rename */}
          {editingTitle ? (
            <input
              autoFocus
              value={editTitleValue}
              onChange={e => setEditTitleValue(e.target.value)}
              onBlur={() => {
                setEditingTitle(false);
                const trimmed = editTitleValue.trim();
                if (trimmed && trimmed !== thread.title) onTitleChange?.(trimmed);
                else setEditTitleValue(thread.title);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setEditingTitle(false);
                  const trimmed = editTitleValue.trim();
                  if (trimmed && trimmed !== thread.title) onTitleChange?.(trimmed);
                  else setEditTitleValue(thread.title);
                }
                if (e.key === 'Escape') { setEditingTitle(false); setEditTitleValue(thread.title); }
              }}
              className="text-sm font-semibold text-ink bg-transparent border-b border-accent/50 focus:outline-none flex-1 min-w-0 pb-px"
            />
          ) : (
            <h2
              className="text-sm font-semibold text-ink-muted truncate flex-1 cursor-text hover:text-ink transition-colors"
              title="Click to rename"
              onClick={() => { setEditingTitle(true); setEditTitleValue(thread.title); }}
            >
              {thread.title}
            </h2>
          )}

          {/* Metadata chip */}
          {thread.metadata?.aiModel && (
            <div
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md shrink-0"
              style={{
                background: thread.metadata.fromCache ? 'oklch(73% 0.12 200 / 0.08)' : 'oklch(72% 0.13 55 / 0.08)',
                border: `1px solid ${thread.metadata.fromCache ? 'oklch(73% 0.12 200 / 0.2)' : 'oklch(72% 0.13 55 / 0.2)'}`,
              }}
              title={thread.metadata.processingTime ? `Generated in ${(thread.metadata.processingTime / 1000).toFixed(1)}s` : undefined}
            >
              <Zap className="w-2.5 h-2.5" style={{ color: thread.metadata.fromCache ? 'oklch(73% 0.12 200)' : 'var(--color-accent)' }} />
              <span className="text-[10px] font-medium" style={{ color: thread.metadata.fromCache ? 'oklch(80% 0.09 200)' : 'var(--color-accent)' }}>
                {thread.metadata.fromCache ? 'Cached' : thread.metadata.aiModel}
                {thread.metadata.processingTime && !thread.metadata.fromCache ? ` · ${(thread.metadata.processingTime / 1000).toFixed(1)}s` : ''}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <ActionBtn
              title={thread.isSaved ? 'Saved' : 'Save visualization'}
              onClick={saving ? () => {} : onSave}
              variant={thread.isSaved ? 'success' : 'default'}
              active={thread.isSaved}
            >
              {saving
                ? <div className="w-3 h-3 border-2 border-success/30 border-t-success rounded-full animate-spin" />
                : <CheckCircle size={13} />
              }
              <span className="hidden sm:inline">{thread.isSaved ? 'Saved' : 'Save'}</span>
            </ActionBtn>

            <ActionBtn
              title={thread.isPublic ? 'Copy public link' : 'Create public share link'}
              onClick={onShare}
              variant={thread.isPublic ? 'success' : 'default'}
              active={thread.isPublic}
            >
              {thread.isPublic ? <Globe size={13} /> : <Share2 size={13} />}
              <span className="hidden sm:inline">{thread.isPublic ? 'Public' : 'Share'}</span>
            </ActionBtn>

            {/* Export dropdown — ref scoped so outside clicks close it but inside clicks don't */}
            <div className="relative" ref={exportRef}>
              <ActionBtn title="Export" onClick={() => setExportOpen(p => !p)} active={exportOpen}>
                {exporting
                  ? <div className="w-3 h-3 border-2 border-ink-faint/30 border-t-ink-muted rounded-full animate-spin" />
                  : <Download size={13} />
                }
                <span className="hidden sm:inline">Export</span>
              </ActionBtn>
              <AnimatePresence>
                {exportOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.13 }}
                    className="absolute right-0 top-full mt-1.5 w-40 rounded-xl overflow-hidden z-50 bg-surface-2 border border-edge shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
                  >
                    <button onClick={handleExportPNG} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors">
                      <ImageIcon size={13} className="text-ink-faint" /> Export as PNG
                    </button>
                    <button onClick={handleExportPDF} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors">
                      <FileText size={13} className="text-ink-faint" /> Export as PDF
                    </button>
                    <div className="h-px bg-edge mx-3 my-1" />
                    <button onClick={() => { setExportOpen(false); onExportData('json'); }} disabled={!thread.vizId} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:enabled:bg-surface-3 hover:enabled:text-ink" title={!thread.vizId ? 'Save the visualization first' : undefined}>
                      <FileJson size={13} className="text-accent" />
                      Export as JSON
                    </button>
                    <button onClick={() => { setExportOpen(false); onExportData('csv'); }} disabled={!thread.vizId} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:enabled:bg-surface-3 hover:enabled:text-ink" title={!thread.vizId ? 'Save the visualization first' : undefined}>
                      <FileSpreadsheet size={13} className="text-accent" />
                      Export as CSV
                    </button>
                    <button onClick={() => { setExportOpen(false); onExportData('html'); }} disabled={!thread.vizId} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:enabled:bg-surface-3 hover:enabled:text-ink" title={!thread.vizId ? 'Save the visualization first' : undefined}>
                      <FileCode size={13} className="text-accent" />
                      Export as HTML
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Live Data dropdown — only shown once a sheet is connected (via the chat composer) */}
            {thread.liveData?.url && (
              <div className="relative" ref={liveRef}>
                <ActionBtn
                  title="Live data connected"
                  onClick={() => setLiveOpen(p => !p)}
                  active={liveOpen}
                  variant="success"
                >
                  <Rss size={12} />
                  <span className="hidden sm:inline">Live</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0"
                    style={{ boxShadow: '0 0 4px var(--color-success)' }}
                  />
                </ActionBtn>

                <AnimatePresence>
                  {liveOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.13 }}
                      className="absolute right-0 top-full mt-1.5 w-72 rounded-xl z-50 bg-surface-2 border border-edge shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
                    >
                      <div className="p-3 flex flex-col gap-2.5">
                        {/* Header */}
                        <div className="flex items-center gap-2">
                          <Rss size={12} className="text-accent" />
                          <span className="text-xs font-semibold text-ink">Live Data</span>
                          <span className="ml-auto text-[10px] font-medium text-success flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                            Connected
                          </span>
                        </div>

                        {/* Source */}
                        <p className="text-[10px] text-ink-faint truncate" title={thread.liveData.url}>
                          {thread.liveData.url}
                        </p>

                        {/* Refresh interval */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-medium text-ink-faint flex items-center gap-1">
                            <Clock size={9} /> Auto-refresh
                          </label>
                          <div className="flex gap-1.5 flex-wrap">
                            {INTERVAL_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setLiveInterval(opt.value);
                                  onLiveDataChange?.({ url: thread.liveData!.url, interval: opt.value });
                                }}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors"
                                style={{
                                  background: liveInterval === opt.value ? 'oklch(72% 0.13 55 / 0.12)' : 'transparent',
                                  borderColor: liveInterval === opt.value ? 'oklch(72% 0.13 55 / 0.4)' : 'var(--color-edge)',
                                  color: liveInterval === opt.value ? 'var(--color-accent)' : 'var(--color-ink-faint)',
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Last refreshed */}
                        {thread.liveData?.lastRefreshed && (
                          <p className="text-[10px] text-ink-faint">
                            Last refreshed: {new Date(thread.liveData.lastRefreshed).toLocaleString()}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-1.5 pt-0.5">
                          <button
                            onClick={() => { onRefreshLiveData?.(); setLiveOpen(false); }}
                            disabled={isRefreshing}
                            className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-edge text-ink-muted hover:bg-surface-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
                            {isRefreshing ? 'Refreshing…' : 'Refresh now'}
                          </button>

                          <button
                            onClick={() => { onLiveDataChange?.(null); setLiveOpen(false); }}
                            className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-edge text-danger hover:bg-surface-3 transition-colors ml-auto"
                          >
                            <Unlink size={11} />
                            Disconnect
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="hidden sm:block w-px h-4 bg-edge mx-0.5" />

            <ActionBtn title="Refine with AI" onClick={() => setEditOpen(p => !p)} active={editOpen}>
              <Pencil size={12} />
              <span className="hidden sm:inline">Refine</span>
            </ActionBtn>
          </div>
        </div>

        {/* Viz — wrapped in ErrorBoundary so a broken viz can't crash the panel */}
        <div ref={vizAreaRef} className="flex-1 relative overflow-hidden min-h-0" key={thread.id}>
          <VisualizationErrorBoundary>
            {renderViz(thread)}
          </VisualizationErrorBoundary>
        </div>
      </div>

      {/* ── Edit panel (slide in from right; full-screen overlay on mobile) ── */}
      <AnimatePresence>
        {editOpen && (
          <>
            {isMobile && (
              <motion.div
                key="edit-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-30 bg-black/50"
                onClick={() => setEditOpen(false)}
                aria-hidden="true"
              />
            )}
            <motion.div
              key="edit-panel"
              initial={isMobile ? { x: '100%' } : { width: 0, opacity: 0 }}
              animate={isMobile ? { x: 0 } : { width: 380, opacity: 1 }}
              exit={isMobile ? { x: '100%' } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={
                isMobile
                  ? 'fixed top-16 inset-x-0 bottom-0 z-40 overflow-hidden'
                  : 'shrink-0 overflow-hidden relative border-l border-edge'
              }
            >
              <div className={isMobile ? 'w-full h-full flex flex-col bg-surface-1' : 'w-[380px] h-full flex flex-col bg-surface-1'}>
                {/* Edit panel header */}
              <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-edge">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-accent/70" />
                  <span className="text-xs font-semibold text-ink-muted">Refine</span>
                </div>
                <button
                  onClick={() => setEditOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-ink-faint hover:text-ink-muted hover:bg-surface-3 transition-colors"
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
                  theme={resolvedTheme}
                  onThemeChange={onThemeChange}
                />
              </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
