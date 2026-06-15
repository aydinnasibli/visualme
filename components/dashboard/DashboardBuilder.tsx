'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GridLayout, useContainerWidth } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  LayoutDashboard, Plus, Trash2, Share2, Check, Copy,
  ChevronLeft, ChevronRight, Save, BarChart3, Pencil, X,
  ExternalLink, Eye, Globe, Lock, Download, FileText, Images,
  Mail, AlertCircle, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import EChartsRenderer from '@/components/visualizations/EChartsRenderer';
import {
  createDashboard,
  updateDashboard,
  publishDashboard,
  updateDashboardSchedule,
  deleteDashboard,
} from '@/lib/actions/dashboard';
import { exportDashboardAsPDF, exportDashboardAsSlidePNGs } from '@/lib/utils/export-dashboard';
import type { Dashboard, DashboardLayoutItem, DashboardVizSlot } from '@/lib/types/dashboard';
import type { SavedVisualization } from '@/lib/types/visualization';
import type { VisualizationSpec } from '@/lib/types/echarts-spec';

// ─── constants ──────────────────────────────────────────────────────────────

const COLS = 12;
const ROW_H = 80;
const DEFAULT_W = 6;
const DEFAULT_H = 4;
const MAX_SLOTS = 12;

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildShareUrl(dashboardId: string) {
  return `${window.location.origin}/share/dashboard/${dashboardId}`;
}

/** Find the lowest y position to place a new item without overlapping. */
function nextY(layout: DashboardLayoutItem[]): number {
  if (!layout.length) return 0;
  return Math.max(...layout.map(l => l.y + l.h));
}

// ─── sub-components ──────────────────────────────────────────────────────────

/**
 * Renders the real chart only once scrolled near the viewport — avoids
 * mounting many live ECharts canvases at once in the picker list.
 */
function ChartThumbnail({ spec }: { spec: VisualizationSpec }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0">
      {visible ? (
        <EChartsRenderer spec={spec} compact hideTitle className="w-full h-full" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-ink-faint/40 group-hover:text-accent/40 transition-colors">
          <BarChart3 size={32} strokeWidth={1.2} />
        </div>
      )}
    </div>
  );
}

function VizPickerCard({
  viz,
  added,
  onAdd,
}: {
  viz: SavedVisualization;
  added: boolean;
  onAdd: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border transition-all cursor-pointer group"
      style={{
        background: added ? 'oklch(72% 0.13 55 / 0.06)' : 'var(--color-surface-1)',
        borderColor: added ? 'oklch(72% 0.13 55 / 0.35)' : 'var(--color-edge)',
      }}
      onClick={onAdd}
    >
      <div className="h-24 bg-surface-2 relative overflow-hidden">
        <ChartThumbnail spec={viz.spec} />
        {added && (
          <div className="absolute inset-0 flex items-center justify-center bg-accent/10">
            <Check className="w-6 h-6 text-accent" />
          </div>
        )}
      </div>
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-ink line-clamp-1 flex-1">{viz.title}</p>
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
          style={{ background: added ? 'var(--color-accent)' : 'var(--color-surface-2)' }}
        >
          {added
            ? <Check size={10} className="text-surface-0" />
            : <Plus size={10} className="text-ink-faint group-hover:text-ink transition-colors" />
          }
        </div>
      </div>
    </motion.div>
  );
}

function DashboardListItem({
  dashboard,
  active,
  onSelect,
  onDelete,
}: {
  dashboard: Dashboard;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
      style={{
        background: active ? 'oklch(72% 0.13 55 / 0.08)' : 'transparent',
        border: `1px solid ${active ? 'oklch(72% 0.13 55 / 0.3)' : 'transparent'}`,
      }}
      onClick={onSelect}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'oklch(72% 0.13 55 / 0.1)', border: '1px solid oklch(72% 0.13 55 / 0.2)' }}
      >
        <LayoutDashboard size={12} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-ink truncate">{dashboard.title}</p>
        <p className="text-[10px] text-ink-faint">
          {dashboard.slots.length} chart{dashboard.slots.length !== 1 ? 's' : ''}
          {dashboard.isPublic ? ' · shared' : ''}
        </p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-ink-faint hover:text-danger hover:bg-danger/10"
        title="Delete dashboard"
      >
        <Trash2 size={11} />
      </button>
    </motion.div>
  );
}

// ─── grid cell ───────────────────────────────────────────────────────────────

function GridCell({
  viz,
  titleSnapshot,
  onRemove,
}: {
  viz: SavedVisualization | null;
  titleSnapshot: string;
  onRemove: () => void;
}) {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-edge bg-surface-1 relative group">
      {viz ? (
        <>
          <EChartsRenderer spec={viz.spec} className="w-full h-full" />
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(to top, var(--color-surface-0) 70%, transparent)' }}
          >
            <span className="text-[10px] font-medium text-ink-muted truncate max-w-[80%]">{viz.title}</span>
          </div>
        </>
      ) : (
        <div className="h-full flex flex-col items-center justify-center gap-2 text-ink-faint/40">
          <BarChart3 size={28} strokeWidth={1.2} />
          <span className="text-[11px]">{titleSnapshot} — removed</span>
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-surface-0/80 backdrop-blur-sm border border-edge text-ink-muted hover:text-danger hover:bg-danger/10"
        title="Remove from dashboard"
      >
        <X size={11} />
      </button>
    </div>
  );
}

// ─── share modal ─────────────────────────────────────────────────────────────

function ShareModal({
  dashboard,
  onClose,
  onTogglePublic,
  publishing,
}: {
  dashboard: Dashboard;
  onClose: () => void;
  onTogglePublic: (pub: boolean) => Promise<void>;
  publishing: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = dashboard.dashboardId ? buildShareUrl(dashboard.dashboardId) : null;

  const copy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-surface-0/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-md rounded-2xl border border-edge bg-surface-1 p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-ink">Share Dashboard</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Public toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-edge mb-4">
          <div className="flex items-center gap-3">
            {dashboard.isPublic
              ? <Globe size={16} className="text-accent" />
              : <Lock size={16} className="text-ink-faint" />
            }
            <div>
              <p className="text-[13px] font-medium text-ink">
                {dashboard.isPublic ? 'Public' : 'Private'}
              </p>
              <p className="text-[11px] text-ink-faint">
                {dashboard.isPublic ? 'Anyone with the link can view' : 'Only you can see this dashboard'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onTogglePublic(!dashboard.isPublic)}
            disabled={publishing}
            className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none disabled:opacity-50 ${dashboard.isPublic ? 'bg-accent' : 'bg-surface-3'}`}
          >
            <span
              className="block w-4 h-4 rounded-full bg-white shadow absolute top-1 transition-transform"
              style={{ left: dashboard.isPublic ? 'calc(100% - 20px)' : '4px' }}
            />
          </button>
        </div>

        {/* Share link */}
        {dashboard.isPublic && shareUrl && (
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-surface-2 border border-edge text-[12px] text-ink-muted font-mono truncate">
              {shareUrl}
            </div>
            <button
              onClick={copy}
              className="px-3 py-2.5 rounded-xl border border-edge bg-surface-2 hover:bg-surface-3 transition-colors text-ink-faint hover:text-ink flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap"
            >
              {copied ? <><Check size={13} className="text-success" /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2.5 rounded-xl border border-edge bg-surface-2 hover:bg-surface-3 transition-colors text-ink-faint hover:text-ink flex items-center"
              title="Open in new tab"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── schedule modal ───────────────────────────────────────────────────────────

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ScheduleModal({
  dashboard,
  hasLiveData,
  onClose,
  onSave,
  saving,
}: {
  dashboard: Dashboard;
  hasLiveData: boolean;
  onClose: () => void;
  onSave: (schedule: { enabled: boolean; dayOfWeek: number }) => Promise<void>;
  saving: boolean;
}) {
  const [enabled, setEnabled] = useState(dashboard.schedule?.enabled ?? false);
  const [dayOfWeek, setDayOfWeek] = useState(dashboard.schedule?.dayOfWeek ?? 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-surface-0/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-md rounded-2xl border border-edge bg-surface-1 p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-ink">Weekly Email Digest</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Enabled toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-edge mb-4">
          <div className="flex items-center gap-3">
            <Mail size={16} className={enabled ? 'text-accent' : 'text-ink-faint'} />
            <div>
              <p className="text-[13px] font-medium text-ink">
                {enabled ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-[11px] text-ink-faint">
                Refresh connected charts and email a summary
              </p>
            </div>
          </div>
          <button
            onClick={() => setEnabled(p => !p)}
            disabled={saving}
            className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none disabled:opacity-50 ${enabled ? 'bg-accent' : 'bg-surface-3'}`}
          >
            <span
              className="block w-4 h-4 rounded-full bg-white shadow absolute top-1 transition-transform"
              style={{ left: enabled ? 'calc(100% - 20px)' : '4px' }}
            />
          </button>
        </div>

        {/* Day of week */}
        {enabled && (
          <div className="mb-4">
            <label className="text-[11px] font-medium text-ink-faint block mb-1.5">Send on</label>
            <select
              value={dayOfWeek}
              onChange={e => setDayOfWeek(Number(e.target.value))}
              disabled={saving}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-edge text-[12px] text-ink focus:outline-none focus:border-accent/40 disabled:opacity-50"
            >
              {DAY_LABELS.map((label, i) => (
                <option key={i} value={i}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Hint if nothing to refresh */}
        {!hasLiveData && (
          <p className="flex items-start gap-1.5 text-[11px] text-ink-faint mb-4">
            <AlertCircle size={12} className="shrink-0 mt-0.5" />
            Connect a live Google Sheet to a chart to enable refresh.
          </p>
        )}

        {/* Last sent */}
        {dashboard.schedule?.lastSentAt && (
          <p className="text-[11px] text-ink-faint mb-4">
            Last sent: {new Date(dashboard.schedule.lastSentAt).toLocaleString()}
          </p>
        )}

        <button
          onClick={() => onSave({ enabled, dayOfWeek })}
          disabled={saving}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[12px] font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: 'var(--color-accent)' }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Save
        </button>
      </motion.div>
    </div>
  );
}

// ─── title editor ─────────────────────────────────────────────────────────────

function TitleEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const start = () => { setDraft(value); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); };
  const commit = () => { if (draft.trim()) onChange(draft.trim()); setEditing(false); };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="text-xl font-display font-semibold text-ink bg-transparent border-b border-accent outline-none w-56 leading-tight"
        maxLength={200}
      />
    );
  }

  return (
    <button onClick={start} className="flex items-center gap-2 group">
      <span className="text-xl font-display font-semibold text-ink group-hover:text-accent transition-colors leading-tight truncate max-w-[200px]">
        {value}
      </span>
      <Pencil size={13} className="text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

interface DashboardBuilderProps {
  initialVizzes: SavedVisualization[];
  initialDashboards: Dashboard[];
}

export default function DashboardBuilder({ initialVizzes, initialDashboards }: DashboardBuilderProps) {
  const [vizzes] = useState(initialVizzes);
  const [dashboards, setDashboards] = useState(initialDashboards);

  // Active dashboard state
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(
    initialDashboards[0]?._id ?? null
  );
  const activeDashboard = dashboards.find(d => d._id === activeDashboardId) ?? null;

  // Canvas state (derived from activeDashboard, kept in sync on select)
  const [title, setTitle] = useState(activeDashboard?.title ?? 'My Dashboard');
  const [slots, setSlots] = useState<DashboardVizSlot[]>(activeDashboard?.slots ?? []);
  const [layout, setLayout] = useState<DashboardLayoutItem[]>(activeDashboard?.layout ?? []);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'slides' | null>(null);

  // Grid width
  const { width: containerWidth, containerRef, mounted } = useContainerWidth();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  /* Close export menu when clicking outside */
  useEffect(() => {
    if (!exportOpen) return;
    const close = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [exportOpen]);

  // ── load dashboard into canvas ──────────────────────────────────────────

  const loadDashboard = (d: Dashboard) => {
    setActiveDashboardId(d._id!);
    setTitle(d.title);
    setSlots(d.slots);
    setLayout(d.layout);
    setIsDirty(false);
  };

  const newDashboard = () => {
    setActiveDashboardId(null);
    setTitle('My Dashboard');
    setSlots([]);
    setLayout([]);
    setIsDirty(false);
  };

  // ── canvas mutations ────────────────────────────────────────────────────

  const addViz = useCallback((viz: SavedVisualization) => {
    if (slots.length >= MAX_SLOTS) { toast.error(`Maximum ${MAX_SLOTS} charts per dashboard`); return; }
    if (slots.some(s => s.vizId === viz._id!)) {
      toast.info('Already added');
      return;
    }
    const y = nextY(layout);
    const newItem: DashboardLayoutItem = { i: viz._id!, x: 0, y, w: DEFAULT_W, h: DEFAULT_H };
    setSlots(prev => [...prev, { vizId: viz._id!, titleSnapshot: viz.title }]);
    setLayout(prev => [...prev, newItem]);
    setIsDirty(true);
  }, [slots, layout]);

  const removeViz = useCallback((vizId: string) => {
    setSlots(prev => prev.filter(s => s.vizId !== vizId));
    setLayout(prev => prev.filter(l => l.i !== vizId));
    setIsDirty(true);
  }, []);

  const handleLayoutChange = useCallback((newLayout: Layout) => {
    const changed = newLayout.length !== layout.length || newLayout.some(item => {
      const prev = layout.find(l => l.i === item.i);
      return !prev || prev.x !== item.x || prev.y !== item.y || prev.w !== item.w || prev.h !== item.h;
    });
    setLayout(newLayout as DashboardLayoutItem[]);
    if (changed) setIsDirty(true);
  }, [layout]);

  const handleTitleChange = (v: string) => { setTitle(v); setIsDirty(true); };

  // ── save ────────────────────────────────────────────────────────────────

  const save = async () => {
    if (!slots.length) { toast.error('Add at least one chart before saving'); return; }
    setSaving(true);
    try {
      if (activeDashboardId) {
        const res = await updateDashboard(activeDashboardId, { title, slots, layout });
        if (!res.success) throw new Error(res.error);
        const updated = res.data!;
        setDashboards(prev => prev.map(d => d._id === updated._id ? updated : d));
        setIsDirty(false);
        toast.success('Dashboard saved');
      } else {
        const res = await createDashboard(title, slots, layout);
        if (!res.success) throw new Error(res.error);
        const created = res.data!;
        setDashboards(prev => [created, ...prev]);
        setActiveDashboardId(created._id!);
        setIsDirty(false);
        toast.success('Dashboard created');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── publish toggle ──────────────────────────────────────────────────────

  const togglePublic = async (pub: boolean) => {
    if (!activeDashboardId) { toast.error('Save the dashboard first'); return; }
    setPublishing(true);
    try {
      const res = await publishDashboard(activeDashboardId, pub);
      if (!res.success) throw new Error(res.error);
      const updated = res.data!;
      setDashboards(prev => prev.map(d => d._id === updated._id ? updated : d));
      // Reflect new isPublic/dashboardId in the view
      setActiveDashboardId(updated._id!);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update share settings');
    } finally {
      setPublishing(false);
    }
  };

  // ── schedule ─────────────────────────────────────────────────────────────

  const updateSchedule = async (schedule: { enabled: boolean; dayOfWeek: number }) => {
    if (!activeDashboardId) { toast.error('Save the dashboard first'); return; }
    setSavingSchedule(true);
    try {
      const res = await updateDashboardSchedule(activeDashboardId, schedule);
      if (!res.success) throw new Error(res.error);
      const updated = res.data!;
      setDashboards(prev => prev.map(d => d._id === updated._id ? updated : d));
      toast.success(schedule.enabled ? 'Weekly digest enabled' : 'Weekly digest disabled');
      setScheduleModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  // ── delete ──────────────────────────────────────────────────────────────

  const doDelete = async (id: string) => {
    const res = await deleteDashboard(id);
    if (!res.success) { toast.error(res.error); return; }
    const remaining = dashboards.filter(d => d._id !== id);
    setDashboards(remaining);
    if (activeDashboardId === id) {
      if (remaining.length) loadDashboard(remaining[0]);
      else newDashboard();
    }
    toast.success('Dashboard deleted');
  };

  const confirmDelete = (id: string) => {
    toast('Delete this dashboard?', {
      action: { label: 'Delete', onClick: () => doDelete(id) },
      cancel: { label: 'Cancel', onClick: () => {} },
      duration: 5000,
    });
  };

  // ── export ──────────────────────────────────────────────────────────────

  const handleExportPDF = useCallback(() => {
    if (!gridRef.current) return;
    setExportOpen(false);
    setExporting('pdf');
    try {
      const ok = exportDashboardAsPDF(gridRef.current, title);
      if (!ok) { toast.error('No charts to export'); return; }
      toast.success('Exported as PDF');
    } catch {
      toast.error('PDF export failed');
    } finally {
      setExporting(null);
    }
  }, [title]);

  const handleExportSlides = useCallback(async () => {
    if (!gridRef.current) return;
    setExportOpen(false);
    setExporting('slides');
    try {
      const titles = slots.map(s => vizzes.find(v => v._id === s.vizId)?.title ?? s.titleSnapshot);
      const count = await exportDashboardAsSlidePNGs(gridRef.current, titles, title);
      if (!count) { toast.error('No charts to export'); return; }
      toast.success(`Exported ${count} slide${count !== 1 ? 's' : ''}`);
    } catch {
      toast.error('Slide export failed');
    } finally {
      setExporting(null);
    }
  }, [slots, vizzes, title]);

  // ── viz lookup for grid cells ───────────────────────────────────────────

  const vizMap = new Map(vizzes.map(v => [v._id!, v]));

  // ── current published dashboard (for share modal) ───────────────────────
  const currentSavedDashboard = dashboards.find(d => d._id === activeDashboardId) ?? null;

  // ── any connected live sheet? (for schedule modal hint) ─────────────────
  const hasLiveData = (currentSavedDashboard?.slots ?? []).some(s => !!vizMap.get(s.vizId)?.liveData?.url);

  return (
    <div className="h-screen flex flex-col bg-surface-0 overflow-hidden">

      {/* ── Top bar ── */}
      <header className="h-14 flex items-center gap-4 px-5 shrink-0 border-b border-edge bg-surface-0/80 backdrop-blur-md z-10">
        <Link href="/dashboard" className="w-8 h-8 rounded-lg bg-surface-2 border border-edge flex items-center justify-center text-accent font-display font-semibold hover:border-accent/40 transition-colors">V</Link>

        <TitleEditor value={title} onChange={handleTitleChange} />

        {isDirty && <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-medium">unsaved</span>}

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {/* Publish/share */}
          {currentSavedDashboard && (
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border text-ink-muted hover:text-ink hover:bg-surface-2"
              style={{ borderColor: 'var(--color-edge)' }}
            >
              <Share2 size={13} />
              Share
              {currentSavedDashboard.isPublic && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
            </button>
          )}

          {/* Schedule digest */}
          {currentSavedDashboard && (
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border text-ink-muted hover:text-ink hover:bg-surface-2"
              style={{ borderColor: 'var(--color-edge)' }}
            >
              <Mail size={13} />
              Digest
              {currentSavedDashboard.schedule?.enabled && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
            </button>
          )}

          {/* Preview */}
          {currentSavedDashboard?.isPublic && currentSavedDashboard.dashboardId && (
            <a
              href={`/share/dashboard/${currentSavedDashboard.dashboardId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border text-ink-muted hover:text-ink hover:bg-surface-2"
              style={{ borderColor: 'var(--color-edge)' }}
            >
              <Eye size={13} />
              Preview
            </a>
          )}

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(p => !p)}
              disabled={!slots.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border text-ink-muted hover:text-ink hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--color-edge)' }}
            >
              {exporting
                ? <div className="w-3 h-3 border-2 border-ink-faint/30 border-t-ink-muted rounded-full animate-spin" />
                : <Download size={13} />
              }
              Export
            </button>
            <AnimatePresence>
              {exportOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.13 }}
                  className="absolute right-0 top-full mt-1.5 w-56 rounded-xl overflow-hidden z-50 bg-surface-2 border border-edge shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
                >
                  <button onClick={handleExportPDF} className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors">
                    <FileText size={13} className="text-accent mt-0.5 shrink-0" />
                    <div>
                      <p>Export as PDF</p>
                      <p className="text-[10px] text-ink-faint">One page, current layout</p>
                    </div>
                  </button>
                  <div className="h-px bg-edge mx-3 my-1" />
                  <button onClick={handleExportSlides} className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors">
                    <Images size={13} className="text-accent mt-0.5 shrink-0" />
                    <div>
                      <p>Export as PNGs</p>
                      <p className="text-[10px] text-ink-faint">One 16:9 slide per chart</p>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Save */}
          <button
            onClick={save}
            disabled={saving || !isDirty}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all disabled:opacity-40 bg-accent text-surface-0 hover:bg-accent-hover"
          >
            {saving
              ? <div className="w-3 h-3 border-2 border-surface-0/40 border-t-surface-0 rounded-full animate-spin" />
              : <Save size={13} />
            }
            Save
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left sidebar: dashboards list ── */}
        <aside
          className="flex flex-col border-r border-edge bg-surface-0 transition-all duration-200 shrink-0"
          style={{ width: sidebarOpen ? 220 : 0, overflow: 'hidden' }}
        >
          <div className="w-[220px] h-full flex flex-col">
            <div className="flex items-center justify-between px-3 h-10 shrink-0 border-b border-edge">
              <span className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Dashboards</span>
              <button
                onClick={newDashboard}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors"
              >
                <Plus size={10} /> New
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
              {/* "unsaved" entry */}
              {!activeDashboardId && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
                  style={{ background: 'oklch(72% 0.13 55 / 0.06)', borderColor: 'oklch(72% 0.13 55 / 0.3)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-accent/10 border border-accent/20">
                    <LayoutDashboard size={12} className="text-accent" />
                  </div>
                  <p className="text-[12px] font-medium text-ink truncate">{title}</p>
                </div>
              )}
              <AnimatePresence>
                {dashboards.map(d => (
                  <DashboardListItem
                    key={d._id}
                    dashboard={d}
                    active={d._id === activeDashboardId}
                    onSelect={() => loadDashboard(d)}
                    onDelete={() => confirmDelete(d._id!)}
                  />
                ))}
              </AnimatePresence>
              {!dashboards.length && activeDashboardId === null && (
                <p className="text-[11px] text-ink-faint/60 text-center pt-4 px-3">
                  Save your first dashboard to see it here.
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-5 h-10 rounded-r-lg flex items-center justify-center bg-surface-1 border border-l-0 border-edge text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors"
          style={{ left: sidebarOpen ? 220 : 0 }}
          title={sidebarOpen ? 'Collapse dashboards list' : 'Expand dashboards list'}
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* ── Canvas ── */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto relative"
          style={{ background: 'var(--color-surface-0)' }}
        >
          {slots.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none select-none">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-edge bg-surface-1">
                <LayoutDashboard size={28} strokeWidth={1.2} className="text-ink-faint/40" />
              </div>
              <p className="text-sm text-ink-faint/60 font-medium">Add charts from the panel on the right</p>
            </div>
          ) : (
            mounted && (
              <GridLayout
                innerRef={gridRef}
                width={containerWidth}
                layout={layout}
                gridConfig={{ cols: COLS, rowHeight: ROW_H, margin: [12, 12], containerPadding: [16, 16] }}
                onLayoutChange={handleLayoutChange}
                resizeConfig={{ handles: ['se', 'sw', 'ne', 'nw', 's', 'e'] }}
              >
                {slots.map(slot => (
                  <div key={slot.vizId}>
                    <GridCell
                      viz={vizMap.get(slot.vizId) ?? null}
                      titleSnapshot={slot.titleSnapshot}
                      onRemove={() => removeViz(slot.vizId)}
                    />
                  </div>
                ))}
              </GridLayout>
            )
          )}
        </div>

        {/* ── Right sidebar: viz picker ── */}
        <aside className="w-64 shrink-0 border-l border-edge bg-surface-0 flex flex-col">
          <div className="flex items-center px-3 h-10 shrink-0 border-b border-edge">
            <span className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider">
              Charts
              <span className="ml-1.5 text-ink-faint/50">({slots.length}/{MAX_SLOTS})</span>
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {vizzes.length === 0 ? (
              <div className="flex flex-col items-center gap-3 pt-8 text-center px-4">
                <BarChart3 size={28} strokeWidth={1.2} className="text-ink-faint/30" />
                <p className="text-[11px] text-ink-faint/60">
                  No saved charts yet. Generate some in the{' '}
                  <Link href="/dashboard" className="text-accent hover:underline">playground</Link>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {vizzes.map(viz => (
                  <VizPickerCard
                    key={viz._id}
                    viz={viz}
                    added={slots.some(s => s.vizId === viz._id!)}
                    onAdd={() => addViz(viz)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── Share modal ── */}
      <AnimatePresence>
        {shareModalOpen && currentSavedDashboard && (
          <ShareModal
            dashboard={currentSavedDashboard}
            onClose={() => setShareModalOpen(false)}
            onTogglePublic={togglePublic}
            publishing={publishing}
          />
        )}
      </AnimatePresence>

      {/* ── Schedule digest modal ── */}
      <AnimatePresence>
        {scheduleModalOpen && currentSavedDashboard && (
          <ScheduleModal
            dashboard={currentSavedDashboard}
            hasLiveData={hasLiveData}
            onClose={() => setScheduleModalOpen(false)}
            onSave={updateSchedule}
            saving={savingSchedule}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
