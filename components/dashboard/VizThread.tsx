'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Sparkles, ArrowUp, ChevronDown, Check, X,
  Network, Share2, Binary, GitFork, Calendar, BarChart2,
  ScatterChart, LayoutGrid, Target, PieChart, Table2,
  SlidersHorizontal, Cloud, Code2, Play, Columns2, TrendingUp, Waves,
  CheckCircle2,
} from 'lucide-react';
import type { VisualizationType, VisualizationData } from '@/lib/types/visualization';

export interface ThreadEntry {
  id: string;
  prompt: string;
  type: VisualizationType;
  data: VisualizationData;
  title: string;
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date | string }>;
  vizId: string | null;
  isSaved: boolean;
}

export const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  network_graph:        { icon: '🕸️',  color: '#8b5cf6', label: 'Network Graph' },
  mind_map:             { icon: '🧠',  color: '#a855f7', label: 'Mind Map' },
  tree_diagram:         { icon: '🌳',  color: '#10b981', label: 'Tree Diagram' },
  timeline:             { icon: '📅',  color: '#06b6d4', label: 'Timeline' },
  gantt_chart:          { icon: '📊',  color: '#6366f1', label: 'Gantt Chart' },
  animated_timeline:    { icon: '🎬',  color: '#ec4899', label: 'Anim. Timeline' },
  flowchart:            { icon: '🔀',  color: '#14b8a6', label: 'Flowchart' },
  sankey_diagram:       { icon: '🌊',  color: '#06b6d4', label: 'Sankey Diagram' },
  swimlane_diagram:     { icon: '🏊',  color: '#0ea5e9', label: 'Swimlane' },
  line_chart:           { icon: '📈',  color: '#10b981', label: 'Line Chart' },
  bar_chart:            { icon: '📊',  color: '#f59e0b', label: 'Bar Chart' },
  scatter_plot:         { icon: '⚫',  color: '#6366f1', label: 'Scatter Plot' },
  heatmap:              { icon: '🔥',  color: '#ef4444', label: 'Heatmap' },
  radar_chart:          { icon: '🎯',  color: '#8b5cf6', label: 'Radar Chart' },
  pie_chart:            { icon: '🥧',  color: '#f97316', label: 'Pie Chart' },
  comparison_table:     { icon: '📋',  color: '#64748b', label: 'Comparison' },
  parallel_coordinates: { icon: '📏',  color: '#a78bfa', label: 'Parallel Coords' },
  word_cloud:           { icon: '☁️',  color: '#06b6d4', label: 'Word Cloud' },
  syntax_diagram:       { icon: '🛤️',  color: '#84cc16', label: 'Syntax Diagram' },
};

const VIZ_TYPES = [
  { id: 'network_graph',        name: 'Network Graph',        icon: Network },
  { id: 'mind_map',             name: 'Mind Map',             icon: Share2 },
  { id: 'tree_diagram',         name: 'Tree Diagram',         icon: Binary },
  { id: 'flowchart',            name: 'Flowchart',            icon: GitFork },
  { id: 'timeline',             name: 'Timeline',             icon: Calendar },
  { id: 'gantt_chart',          name: 'Gantt Chart',          icon: Calendar },
  { id: 'animated_timeline',    name: 'Animated Timeline',    icon: Play },
  { id: 'sankey_diagram',       name: 'Sankey Diagram',       icon: Waves },
  { id: 'swimlane_diagram',     name: 'Swimlane',             icon: Columns2 },
  { id: 'line_chart',           name: 'Line Chart',           icon: TrendingUp },
  { id: 'bar_chart',            name: 'Bar Chart',            icon: BarChart2 },
  { id: 'scatter_plot',         name: 'Scatter Plot',         icon: ScatterChart },
  { id: 'heatmap',              name: 'Heatmap',              icon: LayoutGrid },
  { id: 'radar_chart',          name: 'Radar Chart',          icon: Target },
  { id: 'pie_chart',            name: 'Pie Chart',            icon: PieChart },
  { id: 'comparison_table',     name: 'Comparison Table',     icon: Table2 },
  { id: 'parallel_coordinates', name: 'Parallel Coordinates', icon: SlidersHorizontal },
  { id: 'word_cloud',           name: 'Word Cloud',           icon: Cloud },
  { id: 'syntax_diagram',       name: 'Syntax Diagram',       icon: Code2 },
];

/* ── Thread card ── */
function ThreadCard({ entry, active, onClick }: { entry: ThreadEntry; active: boolean; onClick: () => void }) {
  const meta = TYPE_META[entry.type] ?? { icon: '📊', color: '#6366f1', label: entry.type };
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
        background: active ? 'rgba(82,110,250,0.07)' : 'transparent',
        border: `1px solid ${active ? 'rgba(82,110,250,0.3)' : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      {/* Active accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-opacity duration-150"
        style={{
          background: `linear-gradient(to bottom, ${meta.color}, ${meta.color}50)`,
          opacity: active ? 1 : 0,
        }}
      />

      <div className="flex items-start gap-2.5 pl-1">
        {/* Type icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
          style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}28` }}
        >
          {meta.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[11px] font-semibold truncate" style={{ color: active ? meta.color : '#71717a' }}>
              {meta.label}
            </span>
            {entry.isSaved && (
              <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-emerald-400/60" />
            )}
          </div>
          <p className="text-[12px] text-zinc-300 font-medium leading-snug line-clamp-2">
            {entry.title}
          </p>
          {editCount > 0 && (
            <p className="text-[10px] text-zinc-600 mt-1">
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
      className="w-full rounded-xl p-3"
      style={{ background: 'rgba(82,110,250,0.05)', border: '1px solid rgba(82,110,250,0.18)' }}
    >
      <div className="flex items-start gap-2.5 pl-1">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(82,110,250,0.1)', border: '1px solid rgba(82,110,250,0.22)' }}
        >
          <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-1.5 w-20 rounded-full bg-indigo-500/30 animate-pulse" />
          </div>
          <p className="text-[11px] text-zinc-600 italic line-clamp-2">&ldquo;{prompt}&rdquo;</p>
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
  autoSelect: boolean;
  setAutoSelect: (v: boolean) => void;
  selectedType: string | null;
  setSelectedType: (v: string | null) => void;
}

function ThreadInput({
  input, setInput, onSubmit, loading,
  autoSelect, setAutoSelect, selectedType, setSelectedType,
}: ThreadInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showTypes, setShowTypes] = useState(false);
  const selectedMeta = VIZ_TYPES.find(t => t.id === selectedType);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(e as unknown as React.FormEvent); }
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {showTypes && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden z-50"
            style={{
              background: '#0f1419',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 -24px 48px rgba(0,0,0,0.6)',
            }}
          >
            <div className="p-2 border-b border-white/[0.05] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 px-1 uppercase tracking-wide">Format</span>
              <button onClick={() => setShowTypes(false)} className="p-1 rounded text-zinc-600 hover:text-zinc-300 transition-colors">
                <X size={11} />
              </button>
            </div>
            <div className="max-h-52 overflow-y-auto p-1 custom-scrollbar">
              <button
                onClick={() => { setAutoSelect(true); setSelectedType(null); setShowTypes(false); }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] transition-colors ${
                  autoSelect ? 'bg-primary/12 text-primary' : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200'
                }`}
              >
                <Sparkles size={12} />
                <span className="font-medium">Auto-detect</span>
                {autoSelect && <Check size={10} className="ml-auto" />}
              </button>
              <div className="h-px bg-white/[0.05] my-1" />
              {VIZ_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => { setAutoSelect(false); setSelectedType(type.id); setShowTypes(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] transition-colors ${
                    selectedType === type.id ? 'bg-primary/12 text-primary' : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200'
                  }`}
                >
                  <type.icon size={12} />
                  <span className="font-medium">{type.name}</span>
                  {selectedType === type.id && <Check size={10} className="ml-auto" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={onSubmit}
        className="rounded-xl overflow-hidden transition-all"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Describe what to visualize..."
          disabled={loading}
          rows={1}
          className="w-full bg-transparent border-none focus:ring-0 text-zinc-200 placeholder:text-zinc-600 resize-none text-sm leading-relaxed px-3 pt-3 pb-1 max-h-32 outline-none"
        />
        <div className="flex items-center gap-2 px-2.5 pb-2.5 pt-1">
          <button
            type="button"
            onClick={() => setShowTypes(!showTypes)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              selectedType && selectedMeta
                ? 'bg-primary/10 border-primary/25 text-primary'
                : 'bg-white/[0.03] border-white/[0.07] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]'
            }`}
          >
            {selectedType && selectedMeta
              ? <selectedMeta.icon size={11} />
              : <Sparkles size={11} />
            }
            <span>{selectedType && selectedMeta ? selectedMeta.name : 'Auto'}</span>
            <ChevronDown size={10} />
          </button>
          <div className="flex-1" />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{
              background: input.trim() && !loading ? '#526efa' : 'rgba(255,255,255,0.05)',
              color: input.trim() && !loading ? 'white' : '#52525b',
            }}
          >
            {loading
              ? <div className="w-3 h-3 border-2 border-white/25 border-t-white rounded-full animate-spin" />
              : <ArrowUp size={13} />
            }
          </button>
        </div>
      </form>
    </div>
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
  autoSelect: boolean;
  setAutoSelect: (v: boolean) => void;
  selectedType: string | null;
  setSelectedType: (v: string | null) => void;
}

export default function VizThread({
  threads, activeId, onSelect, onNew, loading, loadingPrompt,
  input, setInput, onSubmit, autoSelect, setAutoSelect, selectedType, setSelectedType,
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
      <div
        className="flex items-center justify-between px-4 h-12 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400/70" />
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Session</span>
        </div>
        {threads.length > 0 && (
          <button
            onClick={onNew}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]"
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
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(82,110,250,0.07)', border: '1px solid rgba(82,110,250,0.13)' }}
              >
                <Sparkles className="w-4.5 h-4.5 text-indigo-400/50" />
              </div>
              <p className="text-xs font-semibold text-zinc-500">Try an example</p>
              <p className="text-[11px] text-zinc-700 mt-1">Click any prompt to get started</p>
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
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors group"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(82,110,250,0.06)'; e.currentTarget.style.borderColor = 'rgba(82,110,250,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                >
                  <span className="text-sm shrink-0">{icon}</span>
                  <span className="text-[11px] text-zinc-400 leading-snug group-hover:text-zinc-200 transition-colors">{label}</span>
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
      <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <ThreadInput
          input={input}
          setInput={setInput}
          onSubmit={onSubmit}
          loading={loading}
          autoSelect={autoSelect}
          setAutoSelect={setAutoSelect}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
        />
      </div>
    </div>
  );
}
