'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, ArrowUp, CheckCircle2, BarChart3, Paperclip, Loader2, LayoutGrid } from 'lucide-react';
import type { VisualizationSpec } from '@/lib/types/echarts-spec';
import type { FileAttachment } from '@/lib/utils/file-attachment';
import { ATTACHMENT_ACCEPT } from '@/lib/utils/file-attachment';
import type { ChartSelection } from '@/lib/utils/chart-types';
import AttachmentChip from '@/components/dashboard/AttachmentChip';
import ChartTypeChip from '@/components/dashboard/ChartTypeChip';
import ChartTypeGalleryModal from '@/components/dashboard/ChartTypeGalleryModal';

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
}

/* ── Thread card ── */
function ThreadCard({ entry, active, onClick }: { entry: ThreadEntry; active: boolean; onClick: () => void }) {
  const editCount = entry.chatHistory.filter(m => m.role === 'user').length;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      className="w-full text-left rounded-xl p-3 transition-colors relative group overflow-hidden"
      style={{
        background: active ? 'oklch(72% 0.13 55 / 0.08)' : 'transparent',
        border: `1px solid ${active ? 'oklch(72% 0.13 55 / 0.3)' : 'var(--color-edge)'}`,
      }}
    >
      {/* Active accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-opacity duration-150"
        style={{
          background: 'linear-gradient(to bottom, var(--color-accent), color-mix(in oklch, var(--color-accent) 50%, transparent))',
          opacity: active ? 1 : 0,
        }}
      />

      <div className="flex items-start gap-2.5 pl-1">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'oklch(72% 0.13 55 / 0.1)', border: '1px solid oklch(72% 0.13 55 / 0.2)' }}
        >
          <BarChart3 size={14} className="text-accent" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {entry.isSaved && (
              <CheckCircle2 className="w-3 h-3 shrink-0 text-success/60" />
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
    </motion.button>
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
}

function ThreadInput({
  input, setInput, onSubmit, loading,
  attachment, attaching, onAttach, onRemoveAttachment,
  chartType, onChooseChartType, onClearChartType,
}: ThreadInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(e as unknown as React.FormEvent); }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAttach(file);
    e.target.value = '';
  };

  const canAttach = !loading && !attaching && !attachment;

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
      {(attachment || chartType) && (
        <div className="px-3 pt-3 flex flex-wrap gap-1.5">
          {attachment && <AttachmentChip attachment={attachment} onRemove={onRemoveAttachment} />}
          {chartType && <ChartTypeChip selection={chartType} onRemove={onClearChartType} />}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={attachment ? 'Add instructions for this data (optional)…' : dragActive ? 'Drop your file to attach it…' : 'Describe what to visualize, or attach a data file…'}
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
        <span className="hidden md:flex items-center gap-1.5 px-1.5 py-1 rounded-lg text-[11px] font-medium text-ink-faint">
          <Sparkles size={11} className="text-accent/60" />
          AI composes the chart
        </span>
        <div className="flex-1" />
        <button
          type="submit"
          disabled={(!input.trim() && !attachment && !chartType) || loading}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
            (input.trim() || attachment || chartType) && !loading
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
}

export default function VizThread({
  threads, activeId, onSelect, onNew, loading, loadingPrompt,
  input, setInput, onSubmit,
  attachment, attaching, onAttach, onRemoveAttachment,
  chartType, onChooseChartType, onClearChartType,
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
          <div className="flex flex-col items-center gap-5 pt-6 pb-4 px-1">
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 bg-accent/7 border border-accent/13">
                <Sparkles className="w-4.5 h-4.5 text-accent/50" />
              </div>
              <p className="text-xs font-semibold text-ink-faint">Try an example</p>
              <p className="text-[11px] text-ink-faint/60 mt-1">Click any prompt to get started</p>
            </div>
            <div className="w-full space-y-1.5">
              {[
                { label: 'Mind map of machine learning concepts', icon: '🧠' },
                { label: 'Software deployment pipeline flowchart', icon: '🔀' },
                { label: 'Timeline of World War II key events', icon: '📅' },
                { label: 'Compare React vs Vue vs Angular', icon: '📋' },
                { label: 'Network graph of blockchain technology', icon: '🕸️' },
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => setInput(label)}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors group bg-surface-1 border border-edge hover:bg-accent/6 hover:border-accent/20"
                >
                  <span className="text-sm shrink-0">{icon}</span>
                  <span className="text-[11px] text-ink-muted leading-snug group-hover:text-ink transition-colors">{label}</span>
                </button>
              ))}
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
        />
      </div>
    </div>
  );
}
