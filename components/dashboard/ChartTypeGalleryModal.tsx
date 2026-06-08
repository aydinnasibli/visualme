"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Sparkles, ChevronLeft, ChevronRight,
  BarChart3, LineChart, PieChart, ScatterChart, Sparkle, CandlestickChart, AlignEndHorizontal,
  BoxSelect, Grid3x3, Radar, AlignVerticalSpaceAround, Gauge, Filter, Waves, CalendarDays,
  Share2, GitBranch, LayoutGrid, CircleDot, Workflow,
} from 'lucide-react';
import { CHART_TYPES, type ChartTypeOption, type ChartTypeVariant, type ChartSelection } from '@/lib/utils/chart-types';

const ICONS_BY_NAME: Record<string, React.ElementType> = {
  BarChart3, LineChart, PieChart, ScatterChart, Sparkle, CandlestickChart, AlignEndHorizontal,
  BoxSelect, Grid3x3, Radar, AlignVerticalSpaceAround, Gauge, Filter, Waves, CalendarDays,
  Share2, GitBranch, LayoutGrid, CircleDot, Workflow,
};

interface ChartTypeGalleryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (selection: ChartSelection) => void;
}

function ChartTypeCard({ chartType, onClick }: { chartType: ChartTypeOption; onClick: () => void }) {
  const Icon = ICONS_BY_NAME[chartType.icon] ?? BarChart3;
  const hasVariants = !!chartType.variants?.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-xl p-3.5 transition-all bg-surface-1 border border-edge hover:border-accent/30 hover:bg-accent/5"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-accent/10 border border-accent/20 group-hover:bg-accent/15 transition-colors">
          <Icon size={16} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[12.5px] font-semibold text-ink truncate">{chartType.label}</p>
            {chartType.tuned && (
              <span title="Has tuned interaction defaults" className="shrink-0 w-1.5 h-1.5 rounded-full bg-success/70" />
            )}
          </div>
          <p className="text-[11px] text-ink-faint leading-snug mt-0.5 line-clamp-2">{chartType.description}</p>
          {hasVariants && (
            <p className="text-[10px] text-accent/70 mt-1 flex items-center gap-1">
              {chartType.variants!.length} styles <ChevronRight size={10} />
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function VariantCard({ variant, onClick }: { variant: ChartTypeVariant; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-xl p-3.5 transition-all bg-surface-1 border border-edge hover:border-accent/30 hover:bg-accent/5"
    >
      <p className="text-[12.5px] font-semibold text-ink">{variant.label}</p>
      <p className="text-[11px] text-ink-faint leading-snug mt-0.5">{variant.description}</p>
    </button>
  );
}

/**
 * Two-step gallery picker: choose a chart type, then (when that type has
 * well-known stylistic forms) narrow to a specific variant — e.g. Bar Chart
 * → Stacked Bars. The final selection is handed back to the caller, which
 * composes an explicit forced-type+variant instruction into the AI prompt
 * and renders it as a removable chip.
 */
export default function ChartTypeGalleryModal({ open, onClose, onSelect }: ChartTypeGalleryModalProps) {
  const [query, setQuery] = useState('');
  const [pendingType, setPendingType] = useState<ChartTypeOption | null>(null);

  useEffect(() => {
    if (!open) { setQuery(''); setPendingType(null); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pendingType) setPendingType(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, pendingType]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CHART_TYPES;
    return CHART_TYPES.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.series.toLowerCase().includes(q)
    );
  }, [query]);

  const handlePickType = (chartType: ChartTypeOption) => {
    if (chartType.variants?.length) {
      setPendingType(chartType);
    } else {
      onSelect({ type: chartType });
      onClose();
    }
  };

  const handlePickVariant = (variant: ChartTypeVariant) => {
    if (!pendingType) return;
    onSelect({ type: pendingType, variant });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.16 }}
            className="w-full max-w-2xl max-h-[82vh] rounded-2xl overflow-hidden flex flex-col surface-panel shadow-[0_24px_64px_rgba(0,0,0,0.35)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-edge shrink-0">
              <div className="min-w-0">
                {pendingType ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPendingType(null)}
                      title="Back to chart types"
                      className="w-6 h-6 rounded-md flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors shrink-0"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-ink truncate">{pendingType.label} — choose a style</h2>
                      <p className="text-[11px] text-ink-faint mt-0.5">Pick the variant that best fits what you want to see</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                      <Sparkles size={14} className="text-accent" />
                      Choose a chart type
                    </h2>
                    <p className="text-[11px] text-ink-faint mt-0.5">
                      Pick one to force the AI to build that exact visualization for your next prompt
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                title="Close"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            {/* Search — only on the type-list step */}
            {!pendingType && (
              <div className="px-5 pt-3.5 shrink-0">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search chart types…"
                    className="w-full pl-8 pr-3 py-2 rounded-lg text-[12.5px] bg-surface-2 border border-edge text-ink placeholder:text-ink-faint outline-none focus:border-accent/40 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Grid — type list or variant list, with a slide transition between steps */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 pt-3.5">
              <AnimatePresence mode="wait">
                {pendingType ? (
                  <motion.div
                    key="variants"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.14 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                  >
                    {pendingType.variants!.map(variant => (
                      <VariantCard key={variant.value} variant={variant} onClick={() => handlePickVariant(variant)} />
                    ))}
                  </motion.div>
                ) : filtered.length > 0 ? (
                  <motion.div
                    key="types"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.14 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                  >
                    {filtered.map(chartType => (
                      <ChartTypeCard
                        key={chartType.series}
                        chartType={chartType}
                        onClick={() => handlePickType(chartType)}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-xs text-ink-faint">No chart types match &ldquo;{query}&rdquo;</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-edge shrink-0">
              <p className="text-[10.5px] text-ink-faint flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success/70 shrink-0" />
                Green dot = tuned with production-grade interaction defaults (zoom, drag, emphasis)
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
