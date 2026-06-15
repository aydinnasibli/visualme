"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sigma, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertTriangle, RotateCcw, Copy, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { STAT_TESTS, runStatTest } from '@/lib/services/statistics-service';
import { fmtStat, fmtDf, formatStatResultSummary } from '@/lib/utils/stat-test-format';
import {
  DEFAULT_ALPHA,
  type ColumnType, type DatasetColumn, type StatTestOption, type StatTestResult, type StatTestSelection,
} from '@/lib/types/statistics';

interface StatRun {
  selection: StatTestSelection;
  result: StatTestResult;
}

interface StatTestPickerModalProps {
  open: boolean;
  onClose: () => void;
  /** Columns detected from the currently attached dataset — same parse the AI prompt embeds, so no re-upload needed. */
  columns: DatasetColumn[];
  rowCount: number;
  /** The last completed run for this dataset, if any — reopening the picker shows it directly instead of starting over. */
  initialRun?: StatRun | null;
  onRun: (run: StatRun) => void;
}

/** Chip-style column picker — single-select (used for grouped tests' value/group pickers) or ordered multi-select (numbered, wide-format tests). Mirrors the chart-type gallery's card pattern. */
function ColumnPicker({ label, options, selected, onPick, numbered = false }: {
  label: string;
  options: DatasetColumn[];
  selected: string[];
  onPick: (name: string) => void;
  numbered?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-ink-faint mb-2">{label}</p>
      {options.length === 0 ? (
        <p className="text-[11.5px] text-ink-faint italic">No matching columns in this dataset.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map(col => {
            const idx = selected.indexOf(col.name);
            const active = idx !== -1;
            return (
              <button
                key={col.name}
                type="button"
                onClick={() => onPick(col.name)}
                className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium border transition-colors ${
                  active
                    ? 'bg-accent/15 border-accent/40 text-accent'
                    : 'bg-surface-1 border-edge text-ink hover:border-accent/30'
                }`}
              >
                {numbered && active && <span className="opacity-70 mr-1">{idx + 1}</span>}
                {col.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const isGrouped = (test: StatTestOption) => 'kind' in test.requiredColumns && test.requiredColumns.kind === 'grouped';

/**
 * Lets the user pick a hypothesis test and the columns to run it on, seeded
 * with the dataset already attached to the composer — no separate paste/upload
 * step. Selecting + running is entirely independent of generating a chart: the
 * user can run a test without ever submitting the prompt, and vice versa.
 */
export default function StatTestPickerModal({ open, onClose, columns, rowCount, initialRun, onRun }: StatTestPickerModalProps) {
  const [step, setStep] = useState<'pick-test' | 'configure' | 'result'>('pick-test');
  const [selectedTest, setSelectedTest] = useState<StatTestOption | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [hypothesizedMean, setHypothesizedMean] = useState('0');
  const [alpha, setAlpha] = useState(String(DEFAULT_ALPHA));
  const [result, setResult] = useState<StatTestResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialRun, setPrevInitialRun] = useState(initialRun);

  if (open && (open !== prevOpen || initialRun !== prevInitialRun)) {
    setPrevOpen(open);
    setPrevInitialRun(initialRun);
    if (initialRun) {
      setSelectedTest(initialRun.selection.test);
      setSelectedColumns(initialRun.selection.columns);
      setHypothesizedMean(String(initialRun.selection.hypothesizedMean ?? 0));
      setAlpha(String(initialRun.selection.alpha));
      setResult(initialRun.result);
      setStep('result');
    } else {
      setStep('pick-test');
      setSelectedTest(null);
      setSelectedColumns([]);
      setResult(null);
    }
    setRunError(null);
  } else if (open !== prevOpen) {
    setPrevOpen(open);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const numericColumns = useMemo(() => columns.filter(c => c.type === 'numeric'), [columns]);
  const categoricalColumns = useMemo(() => columns.filter(c => c.type === 'categorical'), [columns]);

  const availableTests = useMemo(() => STAT_TESTS.filter(t => {
    const spec = t.requiredColumns;
    if ('kind' in spec) return numericColumns.length >= 1 && categoricalColumns.length >= 1;
    return spec.type === 'numeric' ? numericColumns.length >= spec.count : categoricalColumns.length >= spec.count;
  }), [numericColumns, categoricalColumns]);

  const eligibleColumnsForTest = (test: StatTestOption): DatasetColumn[] => {
    if ('kind' in test.requiredColumns) return columns;
    if (test.requiredColumns.type === 'numeric') return numericColumns;
    return categoricalColumns;
  };

  const handlePickTest = (test: StatTestOption) => {
    setSelectedTest(test);
    setRunError(null);
    // Auto-select columns when there's only one valid option per slot — saves the user a click
    // on the common case where they have one numeric + one categorical column.
    if (isGrouped(test)) {
      const autoValue = numericColumns.length === 1 ? numericColumns[0].name : '';
      const autoGroup = categoricalColumns.length === 1 ? categoricalColumns[0].name : '';
      setSelectedColumns([autoValue, autoGroup]);
    } else {
      const eligible = eligibleColumnsForTest(test);
      const need = (test.requiredColumns as { count: number }).count;
      setSelectedColumns(eligible.length <= need ? eligible.map(c => c.name) : []);
    }
    setStep('configure');
  };

  // Wide-format multi-select (one-sample, paired, chi-square, correlation)
  const toggleColumn = (name: string) => {
    if (!selectedTest || isGrouped(selectedTest)) return;
    const need = (selectedTest.requiredColumns as { count: number }).count;
    setSelectedColumns(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name);
      if (prev.length >= need) return [...prev.slice(1), name];
      return [...prev, name];
    });
  };

  // Grouped tests (independent t-test, ANOVA): [valueColumn, groupColumn]
  const setValueColumn = (name: string) => setSelectedColumns(prev => [name, prev[1] ?? '']);
  const setGroupColumn = (name: string) => setSelectedColumns(prev => [prev[0] ?? '', name]);

  const canRun = useMemo(() => {
    if (!selectedTest) return false;
    if (isGrouped(selectedTest)) return Boolean(selectedColumns[0] && selectedColumns[1]);
    return selectedColumns.length === (selectedTest.requiredColumns as { count: number }).count;
  }, [selectedTest, selectedColumns]);

  const handleRun = () => {
    if (!selectedTest || !canRun) return;
    setRunError(null);
    try {
      const cols = selectedColumns.map(name => columns.find(c => c.name === name)!).filter(Boolean);
      const a = parseFloat(alpha);
      const resolvedAlpha = Number.isFinite(a) && a > 0 && a < 1 ? a : DEFAULT_ALPHA;
      const resolvedMean = selectedTest.id === 'one-sample-ttest' ? (parseFloat(hypothesizedMean) || 0) : undefined;
      const computed = runStatTest({
        testId: selectedTest.id,
        columns: cols,
        hypothesizedMean: resolvedMean,
        alpha: resolvedAlpha,
      });
      setResult(computed);
      setStep('result');
      onRun({
        selection: { test: selectedTest, columns: selectedColumns, hypothesizedMean: resolvedMean, alpha: resolvedAlpha },
        result: computed,
      });
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Could not run this test on the selected columns.');
    }
  };

  const handleBack = () => {
    if (step === 'result') { setStep('configure'); return; }
    if (step === 'configure') { setStep('pick-test'); setSelectedTest(null); setSelectedColumns([]); return; }
  };

  const handleReset = () => {
    setStep('pick-test'); setSelectedTest(null); setSelectedColumns([]); setResult(null); setRunError(null);
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(formatStatResultSummary(result)).then(() => {
      setCopied(true);
      toast.success('Result copied');
      setTimeout(() => setCopied(false), 1500);
    });
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
            className="w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col surface-panel shadow-[0_24px_64px_rgba(0,0,0,0.35)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-edge shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {step !== 'pick-test' && (
                  <button
                    onClick={handleBack}
                    title="Back"
                    className="w-6 h-6 rounded-md flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors shrink-0"
                  >
                    <ChevronLeft size={14} />
                  </button>
                )}
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                    <Sigma size={14} className="text-accent" />
                    {step === 'pick-test' && 'Choose a statistical test'}
                    {step === 'configure' && (selectedTest?.label ?? 'Configure')}
                    {step === 'result' && (result?.testName ?? 'Result')}
                  </h2>
                  <p className="text-[11px] text-ink-faint mt-0.5 truncate">
                    {step === 'pick-test' && `${rowCount.toLocaleString()} rows · ${columns.length} columns from your attached data`}
                    {step === 'configure' && selectedTest?.description}
                    {step === 'result' && 'Computed locally with jStat — deterministic, reproducible, never sent to the AI'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {step !== 'pick-test' && (
                  <button
                    onClick={handleReset}
                    title="Start over"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors"
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  title="Close"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
              <AnimatePresence mode="wait">
                {/* ── Step: pick a test ──────────────────────────────────── */}
                {step === 'pick-test' && (
                  <motion.div key="pick-test" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.14 }} className="space-y-2.5">
                    <p className="text-[11px] text-ink-faint">
                      Detected: {numericColumns.length} numeric ({numericColumns.map(c => c.name).join(', ') || '—'}), {categoricalColumns.length} categorical ({categoricalColumns.map(c => c.name).join(', ') || '—'})
                    </p>
                    {availableTests.length === 0 && (
                      <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11.5px] text-amber-500 leading-snug">
                          No test fits this data shape. Most tests need at least two numeric columns (or two categorical columns for chi-square).
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {STAT_TESTS.map(test => {
                        const eligible = availableTests.includes(test);
                        return (
                          <button
                            key={test.id}
                            type="button"
                            disabled={!eligible}
                            onClick={() => handlePickTest(test)}
                            className={`group text-left rounded-xl p-3.5 transition-all border ${
                              eligible
                                ? 'bg-surface-1 border-edge hover:border-accent/30 hover:bg-accent/5 cursor-pointer'
                                : 'bg-surface-1/40 border-edge/50 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <p className="text-[12.5px] font-semibold text-ink">{test.label}</p>
                              {!eligible && <span className="text-[9.5px] text-ink-faint">(needs more columns)</span>}
                            </div>
                            <p className="text-[11px] text-ink-faint leading-snug mt-0.5">{test.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ── Step: configure columns + params ───────────────────── */}
                {step === 'configure' && selectedTest && (
                  <motion.div key="configure" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.14 }} className="space-y-4">
                    {isGrouped(selectedTest) ? (
                      <>
                        <ColumnPicker
                          label="Value column (numeric measurement)"
                          options={numericColumns}
                          selected={selectedColumns[0] ? [selectedColumns[0]] : []}
                          onPick={setValueColumn}
                        />
                        <ColumnPicker
                          label={`Group column (categorical — ${(selectedTest.requiredColumns as { minGroups: number }).minGroups === 2 ? 'exactly 2' : `${(selectedTest.requiredColumns as { minGroups: number }).minGroups} or more`} categories)`}
                          options={categoricalColumns}
                          selected={selectedColumns[1] ? [selectedColumns[1]] : []}
                          onPick={setGroupColumn}
                        />
                      </>
                    ) : (
                      <ColumnPicker
                        label={`Select ${(selectedTest.requiredColumns as { count: number }).count} ${(selectedTest.requiredColumns as { type: ColumnType }).type} column${(selectedTest.requiredColumns as { count: number }).count > 1 ? 's' : ''}${selectedTest.id === 'paired-ttest' ? ' (in the order you want them compared, A − B)' : ''}`}
                        options={eligibleColumnsForTest(selectedTest)}
                        selected={selectedColumns}
                        onPick={toggleColumn}
                        numbered
                      />
                    )}

                    {selectedTest.id === 'one-sample-ttest' && (
                      <div>
                        <label className="text-[11px] font-medium text-ink-faint mb-1.5 block">Hypothesized mean</label>
                        <input
                          type="number"
                          value={hypothesizedMean}
                          onChange={e => setHypothesizedMean(e.target.value)}
                          className="w-40 px-3 py-1.5 rounded-lg text-[12px] bg-surface-2 border border-edge text-ink outline-none focus:border-accent/40 transition-colors"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-medium text-ink-faint mb-1.5 block">
                        Significance level (α) — conventional default is 0.05
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.001"
                        max="0.5"
                        value={alpha}
                        onChange={e => setAlpha(e.target.value)}
                        className="w-32 px-3 py-1.5 rounded-lg text-[12px] bg-surface-2 border border-edge text-ink outline-none focus:border-accent/40 transition-colors"
                      />
                    </div>

                    {runError && (
                      <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-danger/10 border border-danger/20">
                        <AlertTriangle size={13} className="text-danger shrink-0 mt-0.5" />
                        <p className="text-[11.5px] text-danger leading-snug">{runError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleRun}
                      disabled={!canRun}
                      className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-accent text-white hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                    >
                      Run test <ChevronRight size={13} />
                    </button>
                  </motion.div>
                )}

                {/* ── Step: result ────────────────────────────────────────── */}
                {step === 'result' && result && (
                  <motion.div key="result" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} className="space-y-4">
                    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${
                      result.significant ? 'bg-success/10 border-success/25' : 'bg-surface-1 border-edge'
                    }`}>
                      {result.significant
                        ? <CheckCircle2 size={18} className="text-success shrink-0" />
                        : <XCircle size={18} className="text-ink-faint shrink-0" />}
                      <div>
                        <p className="text-[13px] font-semibold text-ink">
                          {result.significant ? 'Statistically significant' : 'Not statistically significant'}
                        </p>
                        <p className="text-[11px] text-ink-faint">at α = {result.alpha}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="rounded-xl p-3 bg-surface-1 border border-edge text-center">
                        <p className="text-[10px] text-ink-faint uppercase tracking-wide">{result.statisticLabel}-statistic</p>
                        <p className="text-[16px] font-semibold text-ink mt-0.5 font-mono">{fmtStat(result.statistic)}</p>
                      </div>
                      <div className="rounded-xl p-3 bg-surface-1 border border-edge text-center">
                        <p className="text-[10px] text-ink-faint uppercase tracking-wide">degrees of freedom</p>
                        <p className="text-[16px] font-semibold text-ink mt-0.5 font-mono">{fmtDf(result.degreesOfFreedom)}</p>
                      </div>
                      <div className="rounded-xl p-3 bg-surface-1 border border-edge text-center">
                        <p className="text-[10px] text-ink-faint uppercase tracking-wide">p-value</p>
                        <p className="text-[16px] font-semibold text-ink mt-0.5 font-mono">{result.pValue < 0.0001 ? '< 0.0001' : result.pValue.toFixed(4)}</p>
                      </div>
                    </div>

                    <div className="rounded-xl p-3.5 bg-surface-1 border border-edge">
                      <p className="text-[10.5px] font-medium text-ink-faint uppercase tracking-wide mb-1.5">What this means</p>
                      <p className="text-[12.5px] text-ink leading-relaxed">{result.interpretation}</p>
                    </div>

                    {result.warnings.length > 0 && (
                      <div className="rounded-xl p-3.5 bg-amber-500/10 border border-amber-500/20">
                        <p className="text-[10.5px] font-medium text-amber-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <AlertTriangle size={11} /> Things to keep in mind
                        </p>
                        <ul className="space-y-1">
                          {result.warnings.map((w, i) => (
                            <li key={i} className="text-[11.5px] text-ink-faint leading-relaxed flex gap-1.5">
                              <span className="text-amber-500/70 shrink-0">•</span>{w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleBack}
                        className="px-4 py-2 rounded-lg text-[12px] font-medium bg-surface-1 border border-edge text-ink hover:border-accent/30 hover:bg-accent/5 transition-colors flex items-center gap-1.5"
                      >
                        <ChevronLeft size={13} /> Try a different test
                      </button>
                      <button
                        onClick={handleCopyResult}
                        title="Copy a citation-ready summary of this result"
                        className="px-4 py-2 rounded-lg text-[12px] font-medium bg-surface-1 border border-edge text-ink hover:border-accent/30 hover:bg-accent/5 transition-colors flex items-center gap-1.5"
                      >
                        {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                        {copied ? 'Copied' : 'Copy result'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-edge shrink-0">
              <p className="text-[10.5px] text-ink-faint flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent/70 shrink-0" />
                Computed with jStat — the same statistic, degrees of freedom, and p-value you&apos;d get from R, SPSS, or scipy for these tests
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
