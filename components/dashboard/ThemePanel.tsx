"use client";

import { useState } from 'react';
import { Sun, Moon, Check, Palette, Type, LayoutGrid } from 'lucide-react';
import type { BrandTheme, ChartSpacing, LegendPosition } from '@/lib/types/echarts-spec';
import { DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from '@/lib/types/echarts-spec';

/* ── Curated brand palette presets — the "beautiful + on-brand" personalization layer ── */
const PALETTE_PRESETS: { name: string; colors: string[] }[] = [
  { name: 'Indigo',  colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#f97316', '#14b8a6'] },
  { name: 'Sunset',  colors: ['#f97316', '#ef4444', '#f59e0b', '#ec4899', '#fb923c', '#dc2626', '#facc15', '#e11d48'] },
  { name: 'Ocean',   colors: ['#0ea5e9', '#06b6d4', '#14b8a6', '#3b82f6', '#22d3ee', '#0284c7', '#2dd4bf', '#0369a1'] },
  { name: 'Forest',  colors: ['#10b981', '#84cc16', '#22c55e', '#65a30d', '#16a34a', '#4ade80', '#a3e635', '#15803d'] },
  { name: 'Berry',   colors: ['#a855f7', '#ec4899', '#8b5cf6', '#d946ef', '#c084fc', '#f472b6', '#9333ea', '#e879f9'] },
  { name: 'Mono',    colors: ['#27272a', '#52525b', '#71717a', '#a1a1aa', '#3f3f46', '#d4d4d8', '#18181b', '#e4e4e7'] },
];

const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Inter',     value: 'Inter, system-ui, -apple-system, sans-serif' },
  { label: 'Georgia',   value: 'Georgia, "Times New Roman", serif' },
  { label: 'Poppins',   value: 'Poppins, system-ui, sans-serif' },
  { label: 'Mono',      value: '"JetBrains Mono", "Fira Code", ui-monospace, monospace' },
];

const SPACING_OPTIONS: { label: string; value: ChartSpacing }[] = [
  { label: 'Compact',     value: 'compact' },
  { label: 'Comfortable', value: 'comfortable' },
  { label: 'Spacious',    value: 'spacious' },
];

const LEGEND_OPTIONS: { label: string; value: LegendPosition }[] = [
  { label: 'Top',    value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Left',   value: 'left' },
  { label: 'Right',  value: 'right' },
  { label: 'Hidden', value: 'none' },
];

function paletteMatches(a: string[], b: string[]) {
  return a.length === b.length && a.every((c, i) => c.toLowerCase() === b[i]?.toLowerCase());
}

/* ── Section wrapper ── */
function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-ink-faint">
        <Icon size={12} />
        <span className="text-[11px] font-semibold uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ── Segmented control ── */
function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { label: string; value: T }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-2 border border-edge">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
            value === opt.value ? 'bg-accent/15 text-accent' : 'text-ink-faint hover:text-ink-muted'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface ThemePanelProps {
  theme: BrandTheme;
  onChange: (theme: BrandTheme) => void;
}

export default function ThemePanel({ theme, onChange }: ThemePanelProps) {
  const [customColor, setCustomColor] = useState(theme.palette[0] ?? '#6366f1');

  const update = (patch: Partial<BrandTheme>) => onChange({ ...theme, ...patch });

  const setMode = (mode: 'light' | 'dark') => {
    const base = mode === 'dark' ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
    // Preserve the user's chosen palette/typography/layout — only swap surface colors.
    update({
      mode,
      background: base.background,
      textColor: base.textColor,
      mutedTextColor: base.mutedTextColor,
      borderColor: base.borderColor,
    });
  };

  const setPalette = (colors: string[]) => update({ palette: colors });

  const setPrimaryColor = (hex: string) => {
    setCustomColor(hex);
    update({ palette: [hex, ...theme.palette.slice(1)] });
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6 custom-scrollbar">
      {/* Mode */}
      <Section icon={theme.mode === 'dark' ? Moon : Sun} title="Mode">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('light')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
              theme.mode === 'light' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface-2 border-edge text-ink-faint hover:text-ink-muted'
            }`}
          >
            <Sun size={13} /> Light
          </button>
          <button
            onClick={() => setMode('dark')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
              theme.mode === 'dark' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface-2 border-edge text-ink-faint hover:text-ink-muted'
            }`}
          >
            <Moon size={13} /> Dark
          </button>
        </div>
      </Section>

      {/* Palette */}
      <Section icon={Palette} title="Brand Palette">
        <div className="grid grid-cols-2 gap-2">
          {PALETTE_PRESETS.map(preset => {
            const active = paletteMatches(preset.colors, theme.palette);
            return (
              <button
                key={preset.name}
                onClick={() => setPalette(preset.colors)}
                className={`relative flex flex-col gap-1.5 p-2 rounded-lg border transition-colors text-left ${
                  active ? 'border-accent/40 bg-accent/5' : 'border-edge bg-surface-2 hover:border-ink-faint/30'
                }`}
              >
                <div className="flex gap-1">
                  {preset.colors.slice(0, 5).map((c, i) => (
                    <span key={i} className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-[11px] font-medium text-ink-muted">{preset.name}</span>
                {active && <Check size={12} className="absolute top-2 right-2 text-accent" />}
              </button>
            );
          })}
        </div>

        {/* Primary color fine-tune */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-2 border border-edge">
          <input
            type="color"
            value={customColor}
            onChange={e => setPrimaryColor(e.target.value)}
            className="w-7 h-7 rounded-md border border-edge cursor-pointer bg-transparent shrink-0"
            title="Primary brand color"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-ink-muted">Primary color</p>
            <p className="text-[10px] text-ink-faint font-mono truncate">{customColor}</p>
          </div>
        </div>
      </Section>

      {/* Typography */}
      <Section icon={Type} title="Typography">
        <div className="grid grid-cols-2 gap-2">
          {FONT_OPTIONS.map(font => (
            <button
              key={font.value}
              onClick={() => update({ fontFamily: font.value })}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border truncate ${
                theme.fontFamily === font.value ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface-2 border-edge text-ink-faint hover:text-ink-muted'
              }`}
              style={{ fontFamily: font.value }}
            >
              {font.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-faint">Title size</span>
            <span className="text-[11px] font-mono text-ink-muted">{theme.fontSize.title}px</span>
          </div>
          <input
            type="range"
            min={14}
            max={28}
            value={theme.fontSize.title}
            onChange={e => update({ fontSize: { ...theme.fontSize, title: Number(e.target.value) } })}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-faint">Label size</span>
            <span className="text-[11px] font-mono text-ink-muted">{theme.fontSize.axisLabel}px</span>
          </div>
          <input
            type="range"
            min={9}
            max={16}
            value={theme.fontSize.axisLabel}
            onChange={e => update({
              fontSize: {
                ...theme.fontSize,
                axisLabel: Number(e.target.value),
                legend: Number(e.target.value),
                tooltip: Number(e.target.value),
              },
            })}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>
      </Section>

      {/* Layout & composition */}
      <Section icon={LayoutGrid} title="Layout">
        <div className="space-y-1.5">
          <span className="text-[11px] text-ink-faint">Spacing</span>
          <Segmented value={theme.spacing} options={SPACING_OPTIONS} onChange={v => update({ spacing: v })} />
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] text-ink-faint">Legend position</span>
          <div className="grid grid-cols-3 gap-1.5">
            {LEGEND_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => update({ legendPosition: opt.value })}
                className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors border ${
                  theme.legendPosition === opt.value ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-surface-2 border-edge text-ink-faint hover:text-ink-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-faint">Corner rounding</span>
            <span className="text-[11px] font-mono text-ink-muted">{theme.borderRadius ?? 0}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={16}
            value={theme.borderRadius ?? 0}
            onChange={e => update({ borderRadius: Number(e.target.value) })}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>
      </Section>

      <p className="text-[10px] text-ink-faint/70 leading-relaxed pt-1 border-t border-edge">
        Changes restyle the chart instantly — structure and data stay untouched. Save the visualization to keep your brand styling.
      </p>
    </div>
  );
}
