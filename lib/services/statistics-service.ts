// ============================================================================
// STATISTICS SERVICE — hypothesis testing on user datasets, powered by jStat
//
// Pure, deterministic, client-safe (no DB/network) — runs entirely in the
// browser. jStat supplies the verified building blocks (distribution CDFs,
// one-sample t-test, ANOVA F-score, Pearson r); the independent t-test
// (Welch's), paired t-test, and chi-square test of independence are composed
// from those primitives the same way every stats library builds them —
// jStat does not ship those three as ready-made test functions.
//
// IMPORTANT: numbers here are the single source of truth for results shown
// to the user. The AI is never involved in computing a statistic or p-value.
// ============================================================================

import { jStat } from 'jstat';
import {
  DEFAULT_ALPHA,
  type DatasetColumn,
  type StatTestId,
  type StatTestOption,
  type StatTestResult,
} from '@/lib/types/statistics';

// ── Test catalog (the "popular, most-used" set) ─────────────────────────────

export const STAT_TESTS: StatTestOption[] = [
  {
    id: 'independent-ttest',
    label: 'Independent samples t-test',
    description: 'Compare the means of two separate groups — pick a numeric value column and a 2-level categorical group column (e.g. score grouped by treatment/control).',
    requiredColumns: { kind: 'grouped', minGroups: 2 },
  },
  {
    id: 'paired-ttest',
    label: 'Paired samples t-test',
    description: 'Compare two measurements taken from the same subjects (e.g. before vs. after).',
    requiredColumns: { count: 2, type: 'numeric' },
  },
  {
    id: 'one-sample-ttest',
    label: 'One-sample t-test',
    description: "Test whether a column's mean differs from a hypothesized value.",
    requiredColumns: { count: 1, type: 'numeric' },
  },
  {
    id: 'one-way-anova',
    label: 'One-way ANOVA',
    description: 'Compare the means of three or more groups at once — pick a numeric value column and a categorical group column with 3+ levels.',
    requiredColumns: { kind: 'grouped', minGroups: 3 },
  },
  {
    id: 'chi-square',
    label: 'Chi-square test of independence',
    description: 'Test whether two categorical variables are associated.',
    requiredColumns: { count: 2, type: 'categorical' },
  },
  {
    id: 'pearson-correlation',
    label: 'Pearson correlation',
    description: 'Measure the strength and direction of a linear relationship between two numeric columns.',
    requiredColumns: { count: 2, type: 'numeric' },
  },
];

// ── Column detection ─────────────────────────────────────────────────────────

/**
 * Classify each column of a parsed dataset (array of row objects, as produced
 * by Papa Parse with dynamicTyping) as numeric or categorical, and collect its
 * clean values (nulls/blanks dropped — the same row-skip per-column, since
 * tests need aligned arrays only within their own selected columns).
 */
export function detectColumns(rows: Record<string, unknown>[]): DatasetColumn[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const keys = Object.keys(rows[0] ?? {});

  return keys.map((name): DatasetColumn => {
    const raw = rows.map(r => r[name]).filter(v => v !== null && v !== undefined && v !== '');
    const numericCount = raw.filter(v => typeof v === 'number' && !Number.isNaN(v)).length;
    const isNumeric = raw.length > 0 && numericCount === raw.length;

    if (isNumeric) {
      return { name, type: 'numeric', values: raw as number[] };
    }
    return { name, type: 'categorical', values: raw.map(v => String(v)) };
  });
}

// ── Shared helpers ───────────────────────────────────────────────────────────

function asNumbers(values: (number | string)[]): number[] {
  return values.map(Number);
}

interface Group {
  label: string;
  values: number[];
}

/** Split a numeric "value" column into groups by a categorical "group" column, in first-seen order. */
function splitByGroup(valueColumn: DatasetColumn, groupColumn: DatasetColumn): Group[] {
  const values = asNumbers(valueColumn.values);
  const labels = groupColumn.values.map(String);
  const n = Math.min(values.length, labels.length);

  const order: string[] = [];
  const buckets = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    const label = labels[i];
    if (!buckets.has(label)) { buckets.set(label, []); order.push(label); }
    buckets.get(label)!.push(values[i]);
  }
  return order.map(label => ({ label, values: buckets.get(label)! }));
}

function sampleSizeWarning(...ns: number[]): string[] {
  return ns.some(n => n < 30)
    ? ['Small sample size (n < 30) — the normality assumption behind this test is harder to verify; treat the p-value as indicative rather than conclusive.']
    : [];
}

function significanceLine(pValue: number, alpha: number): string {
  return pValue < alpha
    ? `p = ${pValue.toFixed(4)} is below α = ${alpha}, so the result is statistically significant — the observed difference is unlikely to be due to chance alone.`
    : `p = ${pValue.toFixed(4)} is not below α = ${alpha}, so the result is not statistically significant — there isn't enough evidence to rule out chance as the explanation.`;
}

// ── One-sample t-test ────────────────────────────────────────────────────────

function runOneSampleTTest(
  column: DatasetColumn,
  hypothesizedMean: number,
  alpha: number = DEFAULT_ALPHA
): StatTestResult {
  const values = asNumbers(column.values);
  const n = values.length;
  const mean = jStat.mean(values);
  const sd = jStat.stdev(values, true);
  const t = (mean - hypothesizedMean) / (sd / Math.sqrt(n));
  const df = n - 1;
  const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
  const significant = pValue < alpha;

  return {
    testId: 'one-sample-ttest',
    testName: 'One-sample t-test',
    columns: [column.name],
    statistic: t,
    statisticLabel: 't',
    degreesOfFreedom: df,
    pValue,
    alpha,
    significant,
    interpretation:
      `Sample mean of "${column.name}" is ${mean.toFixed(3)} (n = ${n}) versus the hypothesized value of ${hypothesizedMean}. ` +
      significanceLine(pValue, alpha),
    warnings: sampleSizeWarning(n),
  };
}

// ── Independent samples t-test (Welch's — robust to unequal variances) ─────

function runIndependentTTest(
  valueColumn: DatasetColumn,
  groupColumn: DatasetColumn,
  alpha: number = DEFAULT_ALPHA
): StatTestResult {
  const groups = splitByGroup(valueColumn, groupColumn);
  if (groups.length !== 2) {
    throw new Error(
      `"${groupColumn.name}" has ${groups.length} distinct groups (${groups.map(g => g.label).join(', ')}) — an independent samples t-test needs exactly 2. ` +
      (groups.length > 2 ? 'Use one-way ANOVA instead.' : 'Pick a column with exactly two categories.')
    );
  }

  const [g1, g2] = groups;
  const a = g1.values, b = g2.values;
  const n1 = a.length, n2 = b.length;
  const mean1 = jStat.mean(a), mean2 = jStat.mean(b);
  const var1 = jStat.variance(a, true), var2 = jStat.variance(b, true);

  const se1 = var1 / n1, se2 = var2 / n2;
  const t = (mean1 - mean2) / Math.sqrt(se1 + se2);
  // Welch–Satterthwaite degrees of freedom
  const df = Math.pow(se1 + se2, 2) / (Math.pow(se1, 2) / (n1 - 1) + Math.pow(se2, 2) / (n2 - 1));
  const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
  const significant = pValue < alpha;

  return {
    testId: 'independent-ttest',
    testName: "Independent samples t-test (Welch's)",
    columns: [valueColumn.name, groupColumn.name],
    statistic: t,
    statisticLabel: 't',
    degreesOfFreedom: df,
    pValue,
    alpha,
    significant,
    interpretation:
      `"${valueColumn.name}" mean for "${g1.label}" = ${mean1.toFixed(3)} (n = ${n1}) vs. "${g2.label}" = ${mean2.toFixed(3)} (n = ${n2}). ` +
      significanceLine(pValue, alpha),
    warnings: [
      "Uses Welch's formula, which doesn't assume the two groups have equal variances — the modern default and safer choice than Student's t-test.",
      ...sampleSizeWarning(n1, n2),
    ],
  };
}

// ── Paired samples t-test ────────────────────────────────────────────────────

function runPairedTTest(
  columnA: DatasetColumn,
  columnB: DatasetColumn,
  alpha: number = DEFAULT_ALPHA
): StatTestResult {
  const a = asNumbers(columnA.values);
  const b = asNumbers(columnB.values);
  const n = Math.min(a.length, b.length);
  const diffs = Array.from({ length: n }, (_, i) => a[i] - b[i]);
  const meanDiff = jStat.mean(diffs);
  const sdDiff = jStat.stdev(diffs, true);
  const t = meanDiff / (sdDiff / Math.sqrt(n));
  const df = n - 1;
  const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
  const significant = pValue < alpha;

  const warnings = sampleSizeWarning(n);
  if (a.length !== b.length) {
    warnings.unshift(
      `"${columnA.name}" and "${columnB.name}" have different lengths (${a.length} vs. ${b.length}) — only the first ${n} matched pairs were used. Paired tests require rows to represent the same subjects.`
    );
  }

  return {
    testId: 'paired-ttest',
    testName: 'Paired samples t-test',
    columns: [columnA.name, columnB.name],
    statistic: t,
    statisticLabel: 't',
    degreesOfFreedom: df,
    pValue,
    alpha,
    significant,
    interpretation:
      `Mean difference ("${columnA.name}" − "${columnB.name}") = ${meanDiff.toFixed(3)} across ${n} pairs. ` +
      significanceLine(pValue, alpha),
    warnings,
  };
}

// ── One-way ANOVA ────────────────────────────────────────────────────────────

function runOneWayAnova(
  valueColumn: DatasetColumn,
  groupColumn: DatasetColumn,
  alpha: number = DEFAULT_ALPHA
): StatTestResult {
  const groups = splitByGroup(valueColumn, groupColumn);
  if (groups.length < 3) {
    throw new Error(
      `"${groupColumn.name}" has only ${groups.length} distinct group(s) — one-way ANOVA needs at least 3. ` +
      (groups.length === 2 ? 'Use an independent samples t-test instead.' : 'Pick a column with more categories.')
    );
  }

  const k = groups.length;
  const N = groups.reduce((sum, g) => sum + g.values.length, 0);

  const F = jStat.anovafscore(groups.map(g => g.values));
  const df1 = k - 1;
  const df2 = N - k;
  const pValue = 1 - jStat.centralF.cdf(F, df1, df2);
  const significant = pValue < alpha;

  const means = groups.map(g => `"${g.label}" = ${jStat.mean(g.values).toFixed(3)}`).join(', ');

  return {
    testId: 'one-way-anova',
    testName: 'One-way ANOVA',
    columns: [valueColumn.name, groupColumn.name],
    statistic: F,
    statisticLabel: 'F',
    degreesOfFreedom: [df1, df2],
    pValue,
    alpha,
    significant,
    interpretation:
      `Comparing ${k} groups (means: ${means}). ` +
      (significant
        ? `p = ${pValue.toFixed(4)} is below α = ${alpha} — at least one group's mean differs significantly from the others (a follow-up pairwise test would identify which).`
        : `p = ${pValue.toFixed(4)} is not below α = ${alpha} — no significant difference was detected between the group means.`),
    warnings: [
      ...sampleSizeWarning(...groups.map(g => g.values.length)),
      'ANOVA assumes roughly equal variances across groups and approximately normal data within each group.',
    ],
  };
}

// ── Chi-square test of independence ─────────────────────────────────────────

function runChiSquareTest(
  columnA: DatasetColumn,
  columnB: DatasetColumn,
  alpha: number = DEFAULT_ALPHA
): StatTestResult {
  const a = columnA.values.map(String);
  const b = columnB.values.map(String);
  const n = Math.min(a.length, b.length);

  const rowLevels = Array.from(new Set(a.slice(0, n)));
  const colLevels = Array.from(new Set(b.slice(0, n)));

  const observed = rowLevels.map(() => colLevels.map(() => 0));
  for (let i = 0; i < n; i++) {
    const r = rowLevels.indexOf(a[i]);
    const c = colLevels.indexOf(b[i]);
    observed[r][c] += 1;
  }

  const rowTotals = observed.map(row => row.reduce((s, v) => s + v, 0));
  const colTotals = colLevels.map((_, c) => observed.reduce((s, row) => s + row[c], 0));
  const grandTotal = rowTotals.reduce((s, v) => s + v, 0);

  let chiSquare = 0;
  let minExpected = Infinity;
  for (let r = 0; r < rowLevels.length; r++) {
    for (let c = 0; c < colLevels.length; c++) {
      const expected = (rowTotals[r] * colTotals[c]) / grandTotal;
      minExpected = Math.min(minExpected, expected);
      chiSquare += Math.pow(observed[r][c] - expected, 2) / expected;
    }
  }

  const df = (rowLevels.length - 1) * (colLevels.length - 1);
  const pValue = 1 - jStat.chisquare.cdf(chiSquare, df);
  const significant = pValue < alpha;

  const warnings: string[] = [];
  if (minExpected < 5) {
    warnings.push('Some expected cell counts are below 5 — the chi-square approximation may be unreliable for this table size; consider grouping categories or using an exact test.');
  }
  if (a.length !== b.length) {
    warnings.push(`"${columnA.name}" and "${columnB.name}" have different lengths (${a.length} vs. ${b.length}) — only the first ${n} paired rows were used.`);
  }

  return {
    testId: 'chi-square',
    testName: 'Chi-square test of independence',
    columns: [columnA.name, columnB.name],
    statistic: chiSquare,
    statisticLabel: 'χ²',
    degreesOfFreedom: df,
    pValue,
    alpha,
    significant,
    interpretation:
      `Cross-tabulating "${columnA.name}" (${rowLevels.length} categories) against "${columnB.name}" (${colLevels.length} categories) over ${grandTotal} rows. ` +
      (significant
        ? `p = ${pValue.toFixed(4)} is below α = ${alpha} — the two variables appear to be associated rather than independent.`
        : `p = ${pValue.toFixed(4)} is not below α = ${alpha} — no significant association was detected; the variables look independent.`),
    warnings,
  };
}

// ── Pearson correlation ──────────────────────────────────────────────────────

function runPearsonCorrelation(
  columnA: DatasetColumn,
  columnB: DatasetColumn,
  alpha: number = DEFAULT_ALPHA
): StatTestResult {
  const a = asNumbers(columnA.values);
  const b = asNumbers(columnB.values);
  const n = Math.min(a.length, b.length);
  const x = a.slice(0, n);
  const y = b.slice(0, n);

  const r = jStat.corrcoeff(x, y);
  const df = n - 2;
  const t = r * Math.sqrt(df / (1 - r * r));
  const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
  const significant = pValue < alpha;

  const strength =
    Math.abs(r) >= 0.7 ? 'a strong' :
    Math.abs(r) >= 0.4 ? 'a moderate' :
    Math.abs(r) >= 0.1 ? 'a weak' : 'almost no';
  const direction = r > 0 ? 'positive' : r < 0 ? 'negative' : '';

  const warnings = sampleSizeWarning(n);
  if (a.length !== b.length) {
    warnings.unshift(`"${columnA.name}" and "${columnB.name}" have different lengths (${a.length} vs. ${b.length}) — only the first ${n} paired rows were used.`);
  }
  warnings.push('Pearson correlation only captures linear relationships and is sensitive to outliers — inspect a scatter plot alongside this result.');

  return {
    testId: 'pearson-correlation',
    testName: 'Pearson correlation',
    columns: [columnA.name, columnB.name],
    statistic: r,
    statisticLabel: 'r',
    degreesOfFreedom: df,
    pValue,
    alpha,
    significant,
    interpretation:
      `r = ${r.toFixed(3)} indicates ${strength}${direction ? ' ' + direction : ''} linear relationship between "${columnA.name}" and "${columnB.name}" (n = ${n}). ` +
      significanceLine(pValue, alpha),
    warnings,
  };
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

export interface RunTestParams {
  testId: StatTestId;
  columns: DatasetColumn[];
  /** Only used by the one-sample t-test. */
  hypothesizedMean?: number;
  alpha?: number;
}

export function runStatTest({ testId, columns, hypothesizedMean, alpha = DEFAULT_ALPHA }: RunTestParams): StatTestResult {
  switch (testId) {
    case 'one-sample-ttest':
      return runOneSampleTTest(columns[0], hypothesizedMean ?? 0, alpha);
    case 'independent-ttest':
      return runIndependentTTest(columns[0], columns[1], alpha);
    case 'paired-ttest':
      return runPairedTTest(columns[0], columns[1], alpha);
    case 'one-way-anova':
      return runOneWayAnova(columns[0], columns[1], alpha);
    case 'chi-square':
      return runChiSquareTest(columns[0], columns[1], alpha);
    case 'pearson-correlation':
      return runPearsonCorrelation(columns[0], columns[1], alpha);
  }
}

export type { DatasetColumn, StatTestOption, StatTestResult };
