'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, CheckCircle,
  Pencil, Sparkles, X, Download, ImageIcon,
  Globe, FileJson, FileSpreadsheet, FileCode, FileText,
  Rss, RefreshCw, Clock, Unlink, Mail, Sigma, Copy, Check, Maximize2, Minimize2, Code2, Undo2, Highlighter,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ThreadEntry, StatRun } from '@/components/dashboard/VizThread';
import { VisualizationErrorBoundary } from '@/components/VisualizationErrorBoundary';
import EditPanel from '@/components/dashboard/EditPanel';
import EChartsRenderer from '@/components/visualizations/EChartsRenderer';
import { exportCanvasAsPNG } from '@/lib/utils/export-png';
import { exportChartAsPDF } from '@/lib/utils/export-dashboard';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { getChartTypeInfo } from '@/lib/utils/series-icon';
import { formatStatResultSummary } from '@/lib/utils/stat-test-format';
import StatTestPickerModal from '@/components/dashboard/StatTestPickerModal';
import type { DatasetColumn } from '@/lib/types/statistics';
import type { BrandTheme, Annotation } from '@/lib/types/echarts-spec';
import { DEFAULT_SUNSET_THEME } from '@/lib/types/echarts-spec';
import AnnotationPanel from '@/components/dashboard/AnnotationPanel';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

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

const EXAMPLE_PROMPTS = [
  'Monthly revenue by product line — bar chart',
  'Show website traffic trends over the last 6 months',
  'Compare team performance scores across 5 departments',
  'Sales funnel: leads → qualified → proposals → closed',
  'Distribution of response times — histogram',
  'Market share breakdown by category — donut chart',
];

/* ── Empty state ── */
function EmptyFocus({ onSuggestPrompt }: { onSuggestPrompt?: (p: string) => void }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8 py-10 select-none gap-8">
      {/* Idle graphic */}
      <div className="relative w-36 h-24 opacity-40">
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
        <p className="text-sm font-semibold text-ink-muted">Describe what you want to see</p>
        <p className="text-xs text-ink-faint mt-1">Type in the panel on the left, or try one of these:</p>
      </div>

      {/* Clickable prompt suggestions */}
      <div className="w-full max-w-sm space-y-1.5">
        {EXAMPLE_PROMPTS.map(prompt => (
          <button
            key={prompt}
            onClick={() => onSuggestPrompt?.(prompt)}
            className="w-full text-left px-3 py-2 rounded-lg text-xs text-ink-muted bg-surface-1 border border-edge hover:bg-accent/6 hover:border-accent/25 hover:text-ink transition-colors"
          >
            {prompt}
          </button>
        ))}
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
  onScheduleChange?: (schedule: { enabled: boolean; dayOfWeek: number }) => void;
  /** Last verified jStat result from the composer's stat test picker — independent of this chart, shown as a "fact check" alongside it. */
  statRun?: StatRun | null;
  /** Columns detected from whichever dataset (file attachment or live sheet) is currently connected — enables running a stat test from this panel too. */
  datasetColumns?: DatasetColumn[];
  datasetRowCount?: number;
  onRunStat?: (run: StatRun) => void;
  /** Lazily fetches & detects columns for this thread's connected live data source, so the Test button works even before `datasetColumns` is populated. */
  onPrepareStatTest?: () => Promise<void>;
  /** True while `onPrepareStatTest` is fetching/parsing the connected live source. */
  preparingStatTest?: boolean;
  /** Revert the chart to the spec it had before the most recent AI edit. Session-only. */
  onUndo?: () => void;
  /** True when there is at least one spec snapshot available to undo to. */
  canUndo?: boolean;
  /** Update the user-added visual annotations (reference lines, text labels). */
  onAnnotate?: (annotations: Annotation[]) => void;
  /** Called when user clicks a suggested prompt in the empty state — parent should populate the composer input. */
  onSuggestPrompt?: (prompt: string) => void;
}

const INTERVAL_OPTIONS = [
  { label: 'Manual', value: 0 },
  { label: 'Every hour', value: 60 },
  { label: 'Every 6h', value: 360 },
  { label: 'Daily', value: 1440 },
] as const;

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function FocusPanel({
  thread, saving, onSave, onShare, onExportData,
  chatHistory, handleChatMessage, isEditing,
  onThemeChange, onTitleChange,
  onLiveDataChange, onRefreshLiveData, isRefreshing, onScheduleChange,
  statRun, datasetColumns, datasetRowCount, onRunStat,
  onPrepareStatTest, preparingStatTest,
  onUndo, canUndo, onAnnotate, onSuggestPrompt,
}: FocusPanelProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [annotateOpen, setAnnotateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [statPickerOpen, setStatPickerOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [exporting, setExporting] = useState(false);
  const [liveInterval, setLiveInterval] = useState(0);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(1);
  const [statCopied, setStatCopied] = useState(false);
  const [presentMode, setPresentMode] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  /* Below `sm`, the Refine panel becomes a full-screen overlay */
  const isMobile = useMediaQuery('(max-width: 639px)');

  /* Escape closes presentation mode */
  useEffect(() => {
    if (!presentMode) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPresentMode(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [presentMode]);

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

  /* Close share popover when clicking outside */
  useEffect(() => {
    if (!shareOpen) return;
    const close = (e: MouseEvent) => {
      if (!shareRef.current?.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [shareOpen]);

  /* Sync URL input and reset inline title editor whenever the active thread changes */
  const [prevThreadId, setPrevThreadId] = useState(thread?.id);
  if (thread?.id !== prevThreadId) {
    setPrevThreadId(thread?.id);
    setLiveInterval(thread?.liveData?.interval ?? 0);
    setScheduleEnabled(thread?.schedule?.enabled ?? false);
    setScheduleDayOfWeek(thread?.schedule?.dayOfWeek ?? 1);
    setLiveOpen(false);
    setShareOpen(false);
    setEditingTitle(false);
    setEditTitleValue('');
    setAnnotateOpen(false);
  }

  const vizAreaRef = useRef<HTMLDivElement | null>(null);

  const safeTitle = (t: ThreadEntry) =>
    t.title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 60) || 'visualization';

  const handleExportPNG = useCallback(async () => {
    if (!vizAreaRef.current || !thread) return;
    setExporting(true);
    setExportOpen(false);
    try {
      const caption = statRun?.result ? formatStatResultSummary(statRun.result) : undefined;
      const ok = exportCanvasAsPNG(vizAreaRef.current, `${safeTitle(thread)}.png`, caption);
      if (!ok) { toast.error('No chart canvas found'); return; }
      toast.success('Exported as PNG');
    } catch {
      toast.error('PNG export failed');
    } finally {
      setExporting(false);
    }
  }, [thread, statRun]);

  const handleExportPDF = useCallback(() => {
    if (!vizAreaRef.current || !thread) return;
    setExportOpen(false);
    try {
      const caption = statRun?.result ? formatStatResultSummary(statRun.result) : undefined;
      const ok = exportChartAsPDF(vizAreaRef.current, thread.title, caption);
      if (!ok) { toast.error('No chart canvas found'); return; }
      toast.success('Exported as PDF');
    } catch {
      toast.error('PDF export failed');
    }
  }, [thread, statRun]);

  const handleExportSVG = useCallback(async () => {
    if (!thread) return;
    setExportOpen(false);
    try {
      const { exportChartAsSVG } = await import('@/lib/utils/export-svg');
      const ok = exportChartAsSVG(thread.spec.option, `${safeTitle(thread)}.svg`);
      if (!ok) toast.error('SVG export failed');
      else toast.success('Exported as SVG');
    } catch {
      toast.error('SVG export failed');
    }
  }, [thread]);

  const handleCopyStatResult = useCallback(() => {
    if (!statRun?.result) return;
    navigator.clipboard.writeText(formatStatResultSummary(statRun.result)).then(() => {
      setStatCopied(true);
      toast.success('Result copied');
      setTimeout(() => setStatCopied(false), 1500);
    });
  }, [statRun]);

  const handleCopyEmbed = useCallback(() => {
    if (!thread?.shareId) return;
    const url = `${window.location.origin}/share/${thread.shareId}`;
    const code = `<iframe src="${url}?embed=1" width="800" height="500" frameborder="0" style="border-radius:12px;"></iframe>`;
    navigator.clipboard.writeText(code).then(() => {
      setEmbedCopied(true);
      toast.success('Embed code copied');
      setTimeout(() => setEmbedCopied(false), 2000);
    }).catch(() => toast.error('Could not copy — please copy the embed code manually'));
  }, [thread]);

  const handleCopyLink = useCallback(() => {
    if (!thread?.shareId) return;
    const url = `${window.location.origin}/share/${thread.shareId}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => toast.error('Could not copy — please copy the link manually'));
  }, [thread]);

  /* ── Render viz ── */
  const renderViz = useCallback((t: ThreadEntry) => {
    // The header above already shows the title — don't render it again inside the chart.
    return <EChartsRenderer spec={t.spec} className="w-full h-full p-6" hideTitle />;
  }, []);

  if (!thread) {
    return (
      <div className="w-full h-full bg-surface-0">
        <EmptyFocus onSuggestPrompt={onSuggestPrompt} />
      </div>
    );
  }

  /* ── Series type badge — thread is guaranteed non-null beyond this point ── */
  const { Icon: BadgeIcon, label: badgeLabel } = getChartTypeInfo(thread.spec.option);

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
          {thread.isDemoThread && (
            <span className="hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'oklch(72% 0.13 55 / 0.12)', color: 'oklch(55% 0.10 55)', border: '1px solid oklch(72% 0.13 55 / 0.25)' }}>
              Example — try editing below
            </span>
          )}

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
            <button
              type="button"
              className="flex items-center gap-1.5 group/title flex-1 min-w-0 text-left"
              title="Click to rename"
              onClick={() => { setEditingTitle(true); setEditTitleValue(thread.title); }}
            >
              <h2 className="text-sm font-semibold text-ink-muted truncate group-hover/title:text-ink transition-colors">
                {thread.title}
              </h2>
              <Pencil size={11} className="shrink-0 text-ink-faint opacity-0 group-hover/title:opacity-100 transition-opacity" />
            </button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {canUndo && (
              <ActionBtn title="Undo last AI edit" onClick={() => onUndo?.()}>
                <Undo2 size={13} />
                <span className="hidden sm:inline">Undo</span>
              </ActionBtn>
            )}
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

            {/* Share button — if already public, opens a popover with link + embed; otherwise calls onShare */}
            <div className="relative" ref={shareRef}>
              <ActionBtn
                title={thread.isPublic ? 'Share options' : 'Create public share link'}
                onClick={() => thread.isPublic ? setShareOpen(p => !p) : onShare()}
                variant={thread.isPublic ? 'success' : 'default'}
                active={thread.isPublic || shareOpen}
              >
                {thread.isPublic ? <Globe size={13} /> : <Share2 size={13} />}
                <span className="hidden sm:inline">{thread.isPublic ? 'Shared' : 'Share'}</span>
              </ActionBtn>
              <AnimatePresence>
                {shareOpen && thread.isPublic && thread.shareId && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.13 }}
                    className="absolute right-0 top-full mt-1.5 w-64 rounded-xl z-50 bg-surface-2 border border-edge shadow-[0_16px_48px_rgba(0,0,0,0.5)] p-3 space-y-2"
                  >
                    <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wide">Share link</p>
                    <div className="flex items-center gap-1.5">
                      <p className="flex-1 text-[10px] text-ink-muted truncate bg-surface-1 border border-edge rounded-lg px-2 py-1.5 font-mono">
                        {`${window.location.origin}/share/${thread.shareId}`}
                      </p>
                      <button
                        onClick={handleCopyLink}
                        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors border border-edge"
                        title="Copy link"
                      >
                        {linkCopied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <div className="h-px bg-edge" />
                    <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wide">Embed</p>
                    <button
                      onClick={() => { setShareOpen(false); handleCopyEmbed(); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors border border-edge"
                    >
                      {embedCopied ? <Check size={12} className="text-success" /> : <Code2 size={12} className="text-ink-faint" />}
                      {embedCopied ? 'Copied!' : 'Copy iframe embed code'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {(thread.liveData?.url || (datasetColumns && datasetColumns.length > 0)) && (
              <ActionBtn
                title="Run a statistical test on the connected dataset"
                onClick={async () => {
                  if (preparingStatTest) return;
                  if (!datasetColumns || datasetColumns.length === 0) {
                    await onPrepareStatTest?.();
                  }
                  setStatPickerOpen(true);
                }}
                active={Boolean(statRun)}
              >
                {preparingStatTest
                  ? <div className="w-3 h-3 border-2 border-ink-faint/30 border-t-ink-muted rounded-full animate-spin" />
                  : <Sigma size={13} />
                }
                <span className="hidden sm:inline">Test</span>
              </ActionBtn>
            )}

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
                    className="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden z-50 bg-surface-2 border border-edge shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
                  >
                    <button onClick={handleExportPNG} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors">
                      <ImageIcon size={13} className="text-ink-faint" /> Export as PNG
                    </button>
                    <button onClick={handleExportSVG} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors">
                      <ImageIcon size={13} className="text-ink-faint" /> Export as SVG
                    </button>
                    <button onClick={handleExportPDF} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors">
                      <FileText size={13} className="text-ink-faint" /> Export as PDF
                    </button>
                    <div className="h-px bg-edge mx-3 my-1" />
                    <button
                      onClick={() => {
                        if (!thread.vizId) { toast.error('Save the visualization first'); return; }
                        setExportOpen(false); onExportData('json');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors"
                    >
                      <FileJson size={13} className="text-accent" /> Export as JSON
                    </button>
                    <button
                      onClick={() => {
                        if (!thread.vizId) { toast.error('Save the visualization first'); return; }
                        setExportOpen(false); onExportData('csv');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors"
                    >
                      <FileSpreadsheet size={13} className="text-accent" /> Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        if (!thread.vizId) { toast.error('Save the visualization first'); return; }
                        setExportOpen(false); onExportData('html');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors"
                    >
                      <FileCode size={13} className="text-accent" /> Export as HTML
                    </button>
                    {thread.shareId && (
                      <>
                        <div className="h-px bg-edge mx-3 my-1" />
                        <button
                          onClick={() => { setExportOpen(false); handleCopyEmbed(); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors"
                        >
                          {embedCopied ? <Check size={13} className="text-success" /> : <Code2 size={13} className="text-ink-faint" />}
                          {embedCopied ? 'Copied!' : 'Copy embed code'}
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ActionBtn title="Presentation mode (Esc to exit)" onClick={() => setPresentMode(true)}>
              <Maximize2 size={13} />
              <span className="hidden sm:inline">Present</span>
            </ActionBtn>

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
                          <p className="text-[10px] text-ink-faint" title={new Date(thread.liveData.lastRefreshed).toLocaleString()}>
                            Last refreshed: {relativeTime(thread.liveData.lastRefreshed)}
                          </p>
                        )}

                        {/* Email digest schedule */}
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-edge">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-medium text-ink-faint flex items-center gap-1">
                              <Mail size={9} /> Email digest
                            </label>
                            <button
                              onClick={() => {
                                if (!thread.vizId) { toast.error('Save the visualization first to enable email digest'); return; }
                                const next = !scheduleEnabled;
                                setScheduleEnabled(next);
                                onScheduleChange?.({ enabled: next, dayOfWeek: scheduleDayOfWeek });
                              }}
                              className={`w-7 h-4 rounded-full relative transition-colors focus:outline-none ${scheduleEnabled ? 'bg-accent' : 'bg-surface-3'}`}
                            >
                              <span
                                className="block w-3 h-3 rounded-full bg-white shadow absolute top-0.5 transition-transform"
                                style={{ left: scheduleEnabled ? 'calc(100% - 14px)' : '2px' }}
                              />
                            </button>
                          </div>

                          {scheduleEnabled && (
                            <select
                              value={scheduleDayOfWeek}
                              onChange={e => {
                                const day = Number(e.target.value);
                                setScheduleDayOfWeek(day);
                                onScheduleChange?.({ enabled: scheduleEnabled, dayOfWeek: day });
                              }}
                              className="w-full px-2 py-1 rounded-md bg-surface-1 border border-edge text-[10px] text-ink focus:outline-none focus:border-accent/40"
                            >
                              {DAY_LABELS.map((label, i) => (
                                <option key={i} value={i}>Weekly on {label}</option>
                              ))}
                            </select>
                          )}

                          {!thread.vizId && (
                            <p className="text-[10px] text-ink-faint">Save this chart to enable email digest.</p>
                          )}

                          {thread.schedule?.lastSentAt && (
                            <p className="text-[10px] text-ink-faint">
                              Last sent: {new Date(thread.schedule.lastSentAt).toLocaleString()}
                            </p>
                          )}
                        </div>

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

            <ActionBtn
              title="Add annotations (reference lines, text labels)"
              onClick={() => { setAnnotateOpen(p => !p); if (editOpen) setEditOpen(false); }}
              active={annotateOpen}
            >
              <Highlighter size={12} />
              <span className="hidden sm:inline">Annotate</span>
            </ActionBtn>

            <ActionBtn title="Refine with AI" onClick={() => { setEditOpen(p => !p); if (annotateOpen) setAnnotateOpen(false); }} active={editOpen}>
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
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 flex items-center justify-center bg-surface-0/60 backdrop-blur-[2px] pointer-events-none"
              >
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-1 border border-accent/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-sm font-medium text-accent">
                  <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin shrink-0" />
                  Updating chart…
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Verified result — real jStat output from the stat test picker, shown as a fact-check alongside the chart */}
        {statRun?.result && (
          <div className="shrink-0 border-t border-edge bg-accent/5 px-6 py-3 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-accent/15 border border-accent/25 mt-0.5">
              <Sigma size={12} className="text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-ink-faint uppercase tracking-wider">Verified result</span>
              <p className="text-[12px] text-ink-muted leading-relaxed mt-0.5">{formatStatResultSummary(statRun.result)}</p>
            </div>
            <button
              type="button"
              onClick={handleCopyStatResult}
              title="Copy this result"
              className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors"
            >
              {statCopied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            </button>
          </div>
        )}

        {/* AI Insight — narrative generated alongside the chart */}
        <AnimatePresence mode="wait">
          {thread.spec.narrative && (
            <motion.div
              key={thread.spec.narrative}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0 border-t border-edge px-6 py-4"
              style={{ background: 'oklch(72% 0.13 55 / 0.04)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: 'oklch(72% 0.13 55 / 0.14)' }}>
                  <Sparkles size={10} style={{ color: 'oklch(60% 0.12 55)' }} />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'oklch(60% 0.12 55)' }}>AI Insight</span>
              </div>
              <p className="text-[13.5px] text-ink-muted leading-relaxed">{thread.spec.narrative}</p>
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* ── Annotate panel (slide in from right) ── */}
      <AnimatePresence>
        {annotateOpen && (
          <>
            {isMobile && (
              <motion.div
                key="annotate-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-30 bg-black/50"
                onClick={() => setAnnotateOpen(false)}
                aria-hidden="true"
              />
            )}
            <motion.div
              key="annotate-panel"
              initial={isMobile ? { x: '100%' } : { width: 0, opacity: 0 }}
              animate={isMobile ? { x: 0 } : { width: 280, opacity: 1 }}
              exit={isMobile ? { x: '100%' } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={
                isMobile
                  ? 'fixed top-16 inset-x-0 bottom-0 z-40 overflow-hidden'
                  : 'shrink-0 overflow-hidden relative border-l border-edge'
              }
            >
              <div className={isMobile ? 'w-full h-full flex flex-col bg-surface-1' : 'w-[280px] h-full flex flex-col bg-surface-1'}>
                <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-edge">
                  <div className="flex items-center gap-2">
                    <Highlighter className="w-3.5 h-3.5 text-accent/70" />
                    <span className="text-xs font-semibold text-ink-muted">Annotate</span>
                    {(thread?.spec.annotations?.length ?? 0) > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/12 text-accent">
                        {thread!.spec.annotations!.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setAnnotateOpen(false)}
                    className="w-6 h-6 rounded flex items-center justify-center text-ink-faint hover:text-ink-muted hover:bg-surface-3 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden min-h-0">
                  <AnnotationPanel
                    annotations={thread?.spec.annotations ?? []}
                    onChange={annotations => onAnnotate?.(annotations)}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {datasetColumns && datasetColumns.length > 0 && (
        <StatTestPickerModal
          open={statPickerOpen}
          onClose={() => setStatPickerOpen(false)}
          columns={datasetColumns}
          rowCount={datasetRowCount ?? datasetColumns[0]?.values.length ?? 0}
          initialRun={statRun}
          onRun={run => onRunStat?.(run)}
        />
      )}

      {/* Presentation mode — fullscreen overlay */}
      <AnimatePresence>
        {presentMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-100 flex flex-col bg-surface-0"
          >
            {/* Minimal top bar */}
            <div className="flex items-center justify-between px-8 py-4 shrink-0">
              <div>
                <p className="text-xs text-ink-faint uppercase tracking-widest font-semibold mb-1">Presentation</p>
                <h2 className="text-lg font-semibold text-ink">{thread.title}</h2>
              </div>
              <button
                onClick={() => setPresentMode(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-faint hover:text-ink hover:bg-surface-2 border border-edge transition-colors"
              >
                <Minimize2 size={12} /> Exit (Esc)
              </button>
            </div>

            {/* Chart fills remaining space */}
            <div className="flex-1 min-h-0 px-8 pb-8">
              <VisualizationErrorBoundary>
                <EChartsRenderer spec={thread.spec} className="w-full h-full" hideTitle />
              </VisualizationErrorBoundary>
            </div>

            {/* AI Insight at bottom of presentation */}
            {thread.spec.narrative && (
              <div className="shrink-0 px-8 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: 'oklch(72% 0.13 55 / 0.14)' }}>
                    <Sparkles size={10} style={{ color: 'oklch(60% 0.12 55)' }} />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'oklch(60% 0.12 55)' }}>AI Insight</span>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed max-w-3xl">{thread.spec.narrative}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
