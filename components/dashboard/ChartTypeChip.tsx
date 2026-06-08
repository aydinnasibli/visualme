"use client";

import { X } from 'lucide-react';
import {
  BarChart3, LineChart, PieChart, ScatterChart, Sparkle, CandlestickChart, AlignEndHorizontal,
  BoxSelect, Grid3x3, Radar, AlignVerticalSpaceAround, Gauge, Filter, Waves, CalendarDays,
  Share2, GitBranch, LayoutGrid, CircleDot, Workflow,
} from 'lucide-react';
import type { ChartSelection } from '@/lib/utils/chart-types';

const ICONS_BY_NAME: Record<string, React.ElementType> = {
  BarChart3, LineChart, PieChart, ScatterChart, Sparkle, CandlestickChart, AlignEndHorizontal,
  BoxSelect, Grid3x3, Radar, AlignVerticalSpaceAround, Gauge, Filter, Waves, CalendarDays,
  Share2, GitBranch, LayoutGrid, CircleDot, Workflow,
};

interface ChartTypeChipProps {
  selection: ChartSelection;
  onRemove: () => void;
}

/** Shows the chart type (and variant, if narrowed) forced onto the next generation request — mirrors AttachmentChip's layout. */
export default function ChartTypeChip({ selection, onRemove }: ChartTypeChipProps) {
  const { type, variant } = selection;
  const Icon = ICONS_BY_NAME[type.icon] ?? BarChart3;

  return (
    <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg bg-accent/8 border border-accent/22 max-w-full">
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-accent/15 border border-accent/25">
        <Icon size={12} className="text-accent" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-[11px] font-medium text-ink truncate max-w-[180px]">
          {type.label}{variant ? <span className="text-ink-muted"> · {variant.label}</span> : null}
        </p>
        <p className="text-[10px] text-ink-faint">Forcing this chart type</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        title="Don't force a chart type"
        className="w-5 h-5 rounded-md flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors shrink-0"
      >
        <X size={11} />
      </button>
    </div>
  );
}
