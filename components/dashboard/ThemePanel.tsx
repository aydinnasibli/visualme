"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Check, Palette, Type, LayoutGrid, Bookmark, Trash2, Loader2 } from 'lucide-react';
import type { BrandTheme, BrandKit, ChartSpacing, LegendPosition } from '@/lib/types/echarts-spec';
import { getBrandKit, saveBrandKit, deleteBrandKit } from '@/lib/actions/brand-kits';

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
  const update = (patch: Partial<BrandTheme>) => onChange({ ...theme, ...patch });

  const setPalette = (colors: string[]) => update({ palette: colors });

  const setPaletteColor = (index: number, hex: string) => {
    const next = [...theme.palette];
    next[index] = hex;
    setPalette(next);
  };

  /* ── Personal brand kit — one saved palette/font/spacing preset, applied to every new chart ── */
  const { isLoaded, isSignedIn } = useAuth();
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [loadingKit, setLoadingKit] = useState(true);
  const [savingKit, setSavingKit] = useState(false);
  const [removingKit, setRemovingKit] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let active = true;
    getBrandKit().then(res => {
      if (!active) return;
      if (res.success) setBrandKit(res.data ?? null);
      setLoadingKit(false);
    });
    return () => { active = false; };
  }, [isLoaded, isSignedIn]);

  const handleSaveKit = async () => {
    setSavingKit(true);
    try {
      const res = await saveBrandKit(theme);
      if (res.success && res.data) {
        setBrandKit(res.data);
        toast.success('Saved as your brand kit');
      } else {
        toast.error(res.error || 'Failed to save brand kit');
      }
    } finally {
      setSavingKit(false);
    }
  };

  const handleApplyKit = () => {
    if (brandKit) onChange(brandKit.theme);
  };

  const handleRemoveKit = async () => {
    setRemovingKit(true);
    try {
      const res = await deleteBrandKit();
      if (res.success) {
        setBrandKit(null);
        toast.success('Removed your brand kit');
      } else {
        toast.error(res.error || 'Failed to remove brand kit');
      }
    } finally {
      setRemovingKit(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6 custom-scrollbar">
      {/* Personal Brand Kit */}
      <Section icon={Bookmark} title="My Brand Kit">
        {!isLoaded || (isSignedIn && loadingKit) ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 size={14} className="animate-spin text-ink-faint" />
          </div>
        ) : !isSignedIn ? (
          <p className="text-[11px] text-ink-faint leading-relaxed">
            Sign in to save this styling as your personal brand kit and apply it to every future chart by default.
          </p>
        ) : brandKit ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 p-2 rounded-lg border border-edge bg-surface-2">
              <div className="flex -space-x-1 shrink-0">
                {brandKit.theme.palette.slice(0, 4).map((c, i) => (
                  <span key={i} className="w-3 h-3 rounded-full ring-1 ring-surface-1" style={{ background: c }} />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-ink-muted">Personal brand kit</p>
                <p className="text-[10px] text-ink-faint">Applied to every new chart by default</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleApplyKit}
                className="flex-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-accent/15 text-accent transition-colors"
              >
                Apply to this chart
              </button>
              <button
                onClick={handleSaveKit}
                disabled={savingKit}
                title="Update with this chart's styling"
                className="px-2.5 py-1.5 rounded-md text-[11px] font-medium border border-edge text-ink-faint hover:text-ink-muted transition-colors disabled:opacity-50"
              >
                {savingKit ? <Loader2 size={12} className="animate-spin" /> : 'Update'}
              </button>
              <button
                onClick={handleRemoveKit}
                disabled={removingKit}
                title="Remove brand kit"
                className="px-2.5 py-1.5 rounded-md text-ink-faint hover:text-danger transition-colors disabled:opacity-50"
              >
                {removingKit ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={handleSaveKit}
              disabled={savingKit}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium border border-dashed border-edge text-ink-faint hover:text-ink-muted hover:border-ink-faint/30 transition-colors disabled:opacity-50"
            >
              {savingKit ? <Loader2 size={12} className="animate-spin" /> : <Bookmark size={12} />}
              Save current styling as my brand kit
            </button>
            <p className="text-[10px] text-ink-faint/70 leading-relaxed">
              Your palette, fonts, and spacing will be applied to every new chart by default.
            </p>
          </>
        )}
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

        {/* Individual series colors — fine-tune any color in the palette */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-ink-faint">Series colors</span>
          <div className="grid grid-cols-4 gap-2">
            {theme.palette.map((color, i) => (
              <label
                key={i}
                className="relative flex flex-col items-center gap-1 cursor-pointer"
                title={`Series ${i + 1} color — ${color}`}
              >
                <span
                  className="w-full aspect-square rounded-lg ring-1 ring-edge transition-shadow hover:ring-ink-faint/40"
                  style={{ background: color }}
                />
                <input
                  type="color"
                  value={color}
                  onChange={e => setPaletteColor(i, e.target.value)}
                  className="absolute top-0 left-0 w-full aspect-square opacity-0 cursor-pointer"
                />
                <span className="text-[9px] font-mono text-ink-faint truncate w-full text-center">{color}</span>
              </label>
            ))}
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
            className="w-full accent-accent"
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
            className="w-full accent-accent"
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
            className="w-full accent-accent"
          />
        </div>
      </Section>

      <p className="text-[10px] text-ink-faint/70 leading-relaxed pt-1 border-t border-edge">
        Changes restyle the chart instantly — structure and data stay untouched. Save the visualization to keep your brand styling.
      </p>
    </div>
  );
}
