'use client';

import { useState } from 'react';
import { Plus, Trash2, Minus, Type } from 'lucide-react';
import type { Annotation } from '@/lib/types/echarts-spec';

const COLOR_PRESETS = [
  { label: 'Red',    value: '#ef4444' },
  { label: 'Amber',  value: '#f59e0b' },
  { label: 'Green',  value: '#22c55e' },
  { label: 'Blue',   value: '#3b82f6' },
  { label: 'Purple', value: '#a855f7' },
];

interface AnnotationPanelProps {
  annotations: Annotation[];
  onChange: (annotations: Annotation[]) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function AnnotationPanel({ annotations, onChange }: AnnotationPanelProps) {
  const [tab, setTab] = useState<'hline' | 'text'>('hline');

  /* ── hline form state ── */
  const [hValue, setHValue] = useState('');
  const [hLabel, setHLabel] = useState('');
  const [hColor, setHColor] = useState(COLOR_PRESETS[0].value);

  /* ── text form state ── */
  const [tText, setTText] = useState('');
  const [tX, setTX] = useState('50');
  const [tY, setTY] = useState('10');
  const [tColor, setTColor] = useState(COLOR_PRESETS[1].value);

  const addHLine = () => {
    const parsed = parseFloat(hValue);
    if (isNaN(parsed)) return;
    const label = hLabel.trim() || String(parsed);
    onChange([...annotations, { id: uid(), type: 'hline', label, value: parsed, color: hColor }]);
    setHValue('');
    setHLabel('');
  };

  const addText = () => {
    if (!tText.trim()) return;
    onChange([...annotations, {
      id: uid(), type: 'text', label: tText.trim(),
      xPct: Number(tX), yPct: Number(tY), color: tColor,
    }]);
    setTText('');
  };

  const remove = (id: string) => onChange(annotations.filter(a => a.id !== id));

  const hlines = annotations.filter(a => a.type === 'hline');
  const texts  = annotations.filter(a => a.type === 'text');

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Tab strip */}
      <div className="flex border-b border-edge shrink-0">
        {([['hline', Minus, 'Reference line'], ['text', Type, 'Text label']] as const).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors"
            style={{
              color: tab === key ? 'var(--color-accent)' : 'var(--color-ink-faint)',
              borderBottom: tab === key ? '2px solid var(--color-accent)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-3 space-y-4">
        {/* ── hline form ── */}
        {tab === 'hline' && (
          <div className="space-y-3">
            <p className="text-[10px] text-ink-faint leading-relaxed">
              Draws a dashed horizontal line across the chart at a specific Y-axis value.
            </p>
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-ink-faint uppercase tracking-wide">Y value</label>
              <input
                type="number"
                placeholder="e.g. 1000000"
                value={hValue}
                onChange={e => setHValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHLine()}
                className="w-full px-2.5 py-1.5 rounded-lg bg-surface-1 border border-edge text-xs text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent/40 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-ink-faint uppercase tracking-wide">Label (optional)</label>
              <input
                type="text"
                placeholder="e.g. Target"
                value={hLabel}
                onChange={e => setHLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHLine()}
                className="w-full px-2.5 py-1.5 rounded-lg bg-surface-1 border border-edge text-xs text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent/40 transition-colors"
              />
            </div>
            <ColorPicker value={hColor} onChange={setHColor} />
            <button
              onClick={addHLine}
              disabled={!hValue.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--color-accent)', color: 'var(--color-surface-0)' }}
            >
              <Plus size={12} /> Add line
            </button>

            {hlines.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wide">Active</p>
                {hlines.map(a => (
                  <AnnotationRow key={a.id} annotation={a} onRemove={remove} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── text form ── */}
        {tab === 'text' && (
          <div className="space-y-3">
            <p className="text-[10px] text-ink-faint leading-relaxed">
              Places a text label at a position on the chart. X/Y are percentages from the top-left corner.
            </p>
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-ink-faint uppercase tracking-wide">Text</label>
              <input
                type="text"
                placeholder="e.g. Peak sales period"
                value={tText}
                onChange={e => setTText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addText()}
                className="w-full px-2.5 py-1.5 rounded-lg bg-surface-1 border border-edge text-xs text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent/40 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <label className="block text-[10px] font-semibold text-ink-faint uppercase tracking-wide">X %</label>
                <input
                  type="number" min="0" max="95" value={tX}
                  onChange={e => setTX(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-1 border border-edge text-xs text-ink focus:outline-none focus:border-accent/40 transition-colors"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="block text-[10px] font-semibold text-ink-faint uppercase tracking-wide">Y %</label>
                <input
                  type="number" min="0" max="95" value={tY}
                  onChange={e => setTY(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-1 border border-edge text-xs text-ink focus:outline-none focus:border-accent/40 transition-colors"
                />
              </div>
            </div>
            <ColorPicker value={tColor} onChange={setTColor} />
            <button
              onClick={addText}
              disabled={!tText.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--color-accent)', color: 'var(--color-surface-0)' }}
            >
              <Plus size={12} /> Add label
            </button>

            {texts.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wide">Active</p>
                {texts.map(a => (
                  <AnnotationRow key={a.id} annotation={a} onRemove={remove} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {annotations.length > 0 && (
        <div className="shrink-0 px-3 pb-3">
          <button
            onClick={() => onChange([])}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-danger border border-danger/25 hover:bg-danger/8 transition-colors"
          >
            <Trash2 size={11} /> Clear all annotations
          </button>
        </div>
      )}
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-semibold text-ink-faint uppercase tracking-wide">Color</label>
      <div className="flex gap-1.5">
        {COLOR_PRESETS.map(c => (
          <button
            key={c.value}
            title={c.label}
            onClick={() => onChange(c.value)}
            className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              background: c.value,
              borderColor: value === c.value ? 'var(--color-ink)' : 'transparent',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AnnotationRow({ annotation, onRemove }: { annotation: Annotation; onRemove: (id: string) => void }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-1 border border-edge group">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: annotation.color || '#ef4444' }}
      />
      <span className="flex-1 text-[11px] text-ink-muted truncate">
        {annotation.type === 'hline'
          ? `y = ${annotation.value}  —  ${annotation.label}`
          : annotation.label}
      </span>
      <button
        onClick={() => onRemove(annotation.id)}
        className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-ink-faint hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 size={10} />
      </button>
    </div>
  );
}
