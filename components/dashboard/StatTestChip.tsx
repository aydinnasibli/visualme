"use client";

import { X, Sigma, CheckCircle2, XCircle } from 'lucide-react';
import type { StatTestResult, StatTestSelection } from '@/lib/types/statistics';

interface StatTestChipProps {
  selection: StatTestSelection;
  result: StatTestResult | null;
  onOpen: () => void;
  onRemove: () => void;
}

/** Shows the test queued/run against the attached dataset — mirrors ChartTypeChip's layout, but is independent of chart generation (clicking reopens the picker; the × clears the run entirely). */
export default function StatTestChip({ selection, result, onOpen, onRemove }: StatTestChipProps) {
  return (
    <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg bg-accent/8 border border-accent/22 max-w-full">
      <button
        type="button"
        onClick={onOpen}
        title="View result"
        className="flex items-center gap-2 min-w-0 text-left"
      >
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-accent/15 border border-accent/25">
          <Sigma size={12} className="text-accent" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-[11px] font-medium text-ink truncate max-w-[200px]">
            {selection.test.label}
            <span className="text-ink-muted"> · {selection.columns.join(', ')}</span>
          </p>
          {result ? (
            <p className="text-[10px] text-ink-faint flex items-center gap-1">
              {result.significant
                ? <CheckCircle2 size={10} className="text-success shrink-0" />
                : <XCircle size={10} className="text-ink-faint shrink-0" />}
              p {result.pValue < 0.0001 ? '< 0.0001' : `= ${result.pValue.toFixed(4)}`} · {result.significant ? 'significant' : 'not significant'}
            </p>
          ) : (
            <p className="text-[10px] text-ink-faint">Tap to run</p>
          )}
        </div>
      </button>
      <button
        type="button"
        onClick={onRemove}
        title="Clear this test"
        className="w-5 h-5 rounded-md flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors shrink-0"
      >
        <X size={11} />
      </button>
    </div>
  );
}
