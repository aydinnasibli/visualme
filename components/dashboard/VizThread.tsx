'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Sparkles, ArrowUp, CheckCircle2, Paperclip, Loader2, LayoutGrid, Sigma, Trash2,
  TrendingUp, FlaskConical, ClipboardList, Workflow, Megaphone, Wallet, Activity, Target,
} from 'lucide-react';
import { getChartTypeInfo } from '@/lib/utils/series-icon';
import type { VisualizationSpec } from '@/lib/types/echarts-spec';
import type { FileAttachment } from '@/lib/utils/file-attachment';
import { ATTACHMENT_ACCEPT } from '@/lib/utils/file-attachment';
import type { ChartSelection } from '@/lib/utils/chart-types';
import type { StatTestResult, StatTestSelection, DatasetColumn } from '@/lib/types/statistics';
import type { LiveSheetData } from '@/lib/utils/live-sheet';
import { STARTER_TEMPLATES, type StarterTemplate } from '@/lib/utils/starter-templates';
import AttachmentChip from '@/components/dashboard/AttachmentChip';
import ChartTypeChip from '@/components/dashboard/ChartTypeChip';
import ChartTypeGalleryModal from '@/components/dashboard/ChartTypeGalleryModal';
import StatTestChip from '@/components/dashboard/StatTestChip';
import StatTestPickerModal from '@/components/dashboard/StatTestPickerModal';
import LiveSheetChip from '@/components/dashboard/LiveSheetChip';
import LiveSheetButton from '@/components/dashboard/LiveSheetButton';

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

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  TrendingUp, FlaskConical, ClipboardList, Workflow, Megaphone, Wallet, Activity, Target,
};

export interface StatRun {
  selection: StatTestSelection;
  result: StatTestResult;
}

export interface ThreadEntry {
  id: string;
  prompt: string;
  spec: VisualizationSpec;
  title: string;
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date | string }>;
  vizId: string | null;
  isSaved: boolean;
  isPublic?: boolean;
  shareId?: string | null;
  metadata?: {
    generatedAt?: string;
    processingTime?: number;
    aiModel?: string;
    fromCache?: boolean;
  };
  liveData?: {
    url: string;
    interval: number;
    lastRefreshed?: string;
  };
  schedule?: {
    enabled: boolean;
    dayOfWeek: number;
    lastSentAt?: string;
  };
  /**
   * The dataset behind the attachment/live sheet this chart was generated
   * from, kept with the thread so the "Test" button stays available for the
   * rest of the session — not just while that attachment is still the active
   * composer state. Not persisted to the DB (re-derived via `liveData.url`
   * for live threads after reload; unavailable for plain attachments).
   */
  datasetColumns?: DatasetColumn[];
  datasetRowCount?: number;
  /** Client-only undo stack — spec snapshots taken before each successful AI edit. Not persisted. */
  specHistory?: VisualizationSpec[];
  /** True for the hardcoded example chart shown on first visit. Cleared when the user edits it. */
  isDemoThread?: boolean;
}

/* ── Thread card ── */
function ThreadCard({ entry, active, onClick, onDelete }: { entry: ThreadEntry; active: boolean; onClick: () => void; onDelete: (id: string) => void }) {
  const editCount = entry.chatHistory.filter(m => m.role === 'user').length;
  const isLive = Boolean(entry.liveData?.url);
  const { Icon: ChartIcon } = getChartTypeInfo(entry.spec.option);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="w-full text-left rounded-xl p-3 transition-colors relative group overflow-hidden cursor-pointer"
      style={{
        background: active ? 'oklch(72% 0.13 55 / 0.08)' : 'transparent',
        border: `1px solid ${active ? 'oklch(72% 0.13 55 / 0.3)' : 'var(--color-edge)'}`,
      }}
    >
      <button
        type="button"
        title="Delete session"
        onClick={e => { e.stopPropagation(); onDelete(entry.id); }}
        className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-ink-faint hover:text-danger hover:bg-surface-3 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
      >
        <Trash2 size={12} />
      </button>

      <div className="flex items-start gap-2.5 pl-1">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'oklch(72% 0.13 55 / 0.1)', border: '1px solid oklch(72% 0.13 55 / 0.2)' }}
        >
          <ChartIcon size={14} className="text-accent" />
        </div>

        <div className="flex-1 min-w-0 pr-5">
          <div className="flex items-center gap-1.5 mb-0.5">
            {entry.isSaved && (
              <CheckCircle2 className="w-3 h-3 shrink-0 text-success/60" />
            )}
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-success" title={entry.liveData?.lastRefreshed ? `Last refreshed ${new Date(entry.liveData.lastRefreshed).toLocaleString()}` : 'Live data connected'}>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0"
                  style={{ boxShadow: '0 0 4px var(--color-success)' }}
                />
                {entry.liveData?.lastRefreshed ? relativeTime(entry.liveData.lastRefreshed) : 'Live'}
              </span>
            )}
          </div>
          <p className="text-[12px] text-ink-muted font-medium leading-snug line-clamp-2">
            {entry.title}
          </p>
          {editCount > 0 && (
            <p className="text-[10px] text-ink-faint/70 mt-1">
              {editCount} refinement{editCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Loading card ── */
function LoadingCard({ prompt }: { prompt: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-xl p-3 bg-accent/5 border border-accent/18"
    >
      <div className="flex items-start gap-2.5 pl-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-accent/10 border border-accent/22">
          <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-1.5 w-20 rounded-full bg-accent/30 animate-pulse" />
          </div>
          <p className="text-[11px] text-ink-faint italic line-clamp-2">&ldquo;{prompt}&rdquo;</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Compact input ── */
interface ThreadInputProps {
  input: string;
  setInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  attachment: FileAttachment | null;
  attaching: boolean;
  onAttach: (file: File) => void;
  onRemoveAttachment: () => void;
  chartType: ChartSelection | null;
  onChooseChartType: (selection: ChartSelection) => void;
  onClearChartType: () => void;
  statRun: StatRun | null;
  onRunStat: (run: StatRun) => void;
  onClearStat: () => void;
  liveSheet: LiveSheetData | null;
  onConnectLiveSheet: (data: LiveSheetData) => void;
  onDisconnectLiveSheet: () => void;
}

function ThreadInput({
  input, setInput, onSubmit, loading,
  attachment, attaching, onAttach, onRemoveAttachment,
  chartType, onChooseChartType, onClearChartType,
  statRun, onRunStat, onClearStat,
  liveSheet, onConnectLiveSheet, onDisconnectLiveSheet,
}: ThreadInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [statPickerOpen, setStatPickerOpen] = useState(false);

  const datasetColumns = attachment?.datasetColumns ?? liveSheet?.datasetColumns;
  const canRunStats = !loading && Boolean(datasetColumns?.length);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(e as unknown as React.FormEvent); }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!canAttach) return;
    const text = e.clipboardData.getData('text');
    if (!text) return;
    const lines = text.trim().split('\n');
    if (lines.length < 2) return;
    const tabs = lines[0].split('\t').length;
    const commas = lines[0].split(',').length;
    const isTabular = (tabs > 1 && lines.every(l => l.split('\t').length === tabs))
      || (commas > 1 && lines.every(l => l.split(',').length === commas));
    if (!isTabular) return;
    e.preventDefault();
    const sep = tabs > 1 ? '\t' : ',';
    const rows: Record<string, string>[] = [];
    const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      const vals = line.split(sep).map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
      rows.push(row);
    }
    const csvContent = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const file = new File([csvContent], 'pasted-data.csv', { type: 'text/csv' });
    onAttach(file);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAttach(file);
    e.target.value = '';
  };

  const canAttach = !loading && !attaching && !attachment && !liveSheet;
  const canConnectLiveSheet = !loading && !attachment;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (!canAttach) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onAttach(file);
  };

  return (
    <form
      onSubmit={onSubmit}
      onDragOver={e => { e.preventDefault(); if (canAttach) setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={`rounded-xl overflow-hidden transition-all surface-control ${dragActive ? 'border-accent/50 bg-accent/5' : ''}`}
    >
      {(attachment || chartType || statRun || liveSheet) && (
        <div className="px-3 pt-3 flex flex-wrap gap-1.5">
          {attachment && <AttachmentChip attachment={attachment} onRemove={onRemoveAttachment} />}
          {liveSheet && <LiveSheetChip sheet={liveSheet} onRemove={onDisconnectLiveSheet} />}
          {chartType && <ChartTypeChip selection={chartType} onRemove={onClearChartType} />}
          {statRun && (
            <StatTestChip
              selection={statRun.selection}
              result={statRun.result}
              onOpen={() => setStatPickerOpen(true)}
              onRemove={onClearStat}
            />
          )}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onPaste={handlePaste}
        placeholder={
          liveSheet ? 'Add instructions for this data (optional)…'
          : attachment ? 'Add instructions for this data (optional)…'
          : dragActive ? 'Drop your file to attach it…'
          : 'Describe what to visualize, or attach a data file…'
        }
        disabled={loading}
        rows={1}
        className="w-full bg-transparent border-none focus:ring-0 text-ink placeholder:text-ink-faint resize-none text-sm leading-relaxed px-3 pt-3 pb-1 max-h-32 outline-none"
      />
      <div className="flex items-center gap-1.5 px-2 pb-2.5 pt-1">
        <input ref={fileInputRef} type="file" accept={ATTACHMENT_ACCEPT} onChange={handleFilePick} className="hidden" />
        <button
          type="button"
          title="Attach a data file (CSV, JSON, TXT)"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAttach}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors disabled:opacity-35 disabled:hover:bg-transparent"
        >
          {attaching
            ? <Loader2 size={13} className="animate-spin" />
            : <Paperclip size={13} />
          }
        </button>
        <LiveSheetButton
          liveSheet={liveSheet}
          onConnect={onConnectLiveSheet}
          onDisconnect={onDisconnectLiveSheet}
          disabled={!canConnectLiveSheet}
        />
        <button
          type="button"
          title="Choose a chart type to force the AI to build that exact visualization"
          onClick={() => setGalleryOpen(true)}
          disabled={loading}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-35 ${
            chartType ? 'text-accent bg-accent/10 hover:bg-accent/15' : 'text-ink-faint hover:text-ink hover:bg-surface-3'
          }`}
        >
          <LayoutGrid size={13} />
        </button>
        <button
          type="button"
          title={canRunStats ? 'Run a statistical test on the attached dataset' : 'Attach a tabular data file to enable statistical tests'}
          onClick={() => setStatPickerOpen(true)}
          disabled={!canRunStats}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-35 ${
            statRun ? 'text-accent bg-accent/10 hover:bg-accent/15' : 'text-ink-faint hover:text-ink hover:bg-surface-3'
          }`}
        >
          <Sigma size={13} />
        </button>
        <span className="hidden md:flex items-center gap-1.5 px-1.5 py-1 rounded-lg text-[11px] font-medium text-ink-faint whitespace-nowrap">
          <Sparkles size={11} className="text-accent/60" />
          AI-composed
        </span>
        <div className="flex-1" />
        <button
          type="submit"
          disabled={(!input.trim() && !attachment && !chartType && !liveSheet) || loading}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
            (input.trim() || attachment || chartType || liveSheet) && !loading
              ? 'bg-accent text-surface-0 hover:bg-accent-hover'
              : 'bg-surface-2 text-ink-faint'
          }`}
        >
          {loading
            ? <div className="w-3 h-3 border-2 border-surface-0/40 border-t-surface-0 rounded-full animate-spin" />
            : <ArrowUp size={13} />
          }
        </button>
      </div>
      <ChartTypeGalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={onChooseChartType}
      />
      {datasetColumns && (
        <StatTestPickerModal
          open={statPickerOpen}
          onClose={() => setStatPickerOpen(false)}
          columns={datasetColumns}
          rowCount={attachment?.rowCount ?? liveSheet?.rowCount ?? datasetColumns[0]?.values.length ?? 0}
          initialRun={statRun}
          onRun={onRunStat}
        />
      )}
    </form>
  );
}

/* ── Main component ── */
export interface VizThreadProps {
  threads: ThreadEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  loading: boolean;
  loadingPrompt: string;
  input: string;
  setInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  attachment: FileAttachment | null;
  attaching: boolean;
  onAttach: (file: File) => void;
  onRemoveAttachment: () => void;
  chartType: ChartSelection | null;
  onChooseChartType: (selection: ChartSelection) => void;
  onClearChartType: () => void;
  statRun: StatRun | null;
  onRunStat: (run: StatRun) => void;
  onClearStat: () => void;
  liveSheet: LiveSheetData | null;
  onConnectLiveSheet: (data: LiveSheetData) => void;
  onDisconnectLiveSheet: () => void;
  onDelete: (id: string) => void;
  onUseTemplate: (template: StarterTemplate) => void;
}

export default function VizThread({
  threads, activeId, onSelect, onNew, loading, loadingPrompt,
  input, setInput, onSubmit,
  attachment, attaching, onAttach, onRemoveAttachment,
  chartType, onChooseChartType, onClearChartType,
  statRun, onRunStat, onClearStat,
  liveSheet, onConnectLiveSheet, onDisconnectLiveSheet,
  onDelete, onUseTemplate,
}: VizThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threads.length > 0 || loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threads.length, loading]);

  return (
    <div className="h-full flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-edge">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent/70" />
          <span className="text-[11px] font-semibold text-ink-faint uppercase tracking-wider">Session</span>
        </div>
        {threads.length > 0 && (
          <button
            onClick={onNew}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors text-ink-faint hover:text-ink hover:bg-surface-3"
          >
            <Plus size={11} />
            New
          </button>
        )}
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar min-h-0">
        {threads.length === 0 && !loading && (
          <div className="flex flex-col gap-4 pt-5 pb-4 px-1">
            <div className="text-center px-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 bg-accent/7 border border-accent/13">
                <Sparkles className="w-4.5 h-4.5 text-accent/50" />
              </div>
              <p className="text-xs font-semibold text-ink-faint">Start from a template</p>
              <p className="text-[11px] text-ink-faint/60 mt-1">Sample data included — tap to load, then send</p>
            </div>
            <div className="w-full space-y-1.5">
              {STARTER_TEMPLATES.map(template => {
                const Icon = TEMPLATE_ICONS[template.icon] ?? Sparkles;
                return (
                  <button
                    key={template.id}
                    onClick={() => onUseTemplate(template)}
                    className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-colors group bg-surface-1 border border-edge hover:bg-accent/6 hover:border-accent/20"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-accent/10 border border-accent/20">
                      <Icon size={13} className="text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-[11.5px] font-semibold text-ink truncate">{template.title}</p>
                        <span className="shrink-0 text-[9px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-full text-accent/70 bg-accent/8 border border-accent/15">
                          {template.category}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-ink-faint leading-snug line-clamp-2 group-hover:text-ink-muted transition-colors">
                        {template.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {threads.map(entry => (
            <ThreadCard
              key={entry.id}
              entry={entry}
              active={entry.id === activeId}
              onClick={() => onSelect(entry.id)}
              onDelete={onDelete}
            />
          ))}
          {loading && <LoadingCard key="__loading" prompt={loadingPrompt} />}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Compact input */}
      <div className="shrink-0 p-3 border-t border-edge">
        <ThreadInput
          input={input}
          setInput={setInput}
          onSubmit={onSubmit}
          loading={loading}
          attachment={attachment}
          attaching={attaching}
          onAttach={onAttach}
          onRemoveAttachment={onRemoveAttachment}
          chartType={chartType}
          onChooseChartType={onChooseChartType}
          onClearChartType={onClearChartType}
          statRun={statRun}
          onRunStat={onRunStat}
          onClearStat={onClearStat}
          liveSheet={liveSheet}
          onConnectLiveSheet={onConnectLiveSheet}
          onDisconnectLiveSheet={onDisconnectLiveSheet}
        />
      </div>
    </div>
  );
}
