// ============================================================================
// STATISTICS TYPES — hypothesis testing on user datasets
//
// A dataset is parsed into typed columns (numeric / categorical), the user
// picks a test + the columns it applies to, and the service returns a
// structured result: test statistic, degrees of freedom, p-value, and a
// plain-language interpretation. Numbers always come from jStat — never
// from the AI — so results are reproducible and verifiable.
// ============================================================================

export type ColumnType = 'numeric' | 'categorical';

export interface DatasetColumn {
  name: string;
  type: ColumnType;
  /** Raw values in row order, already coerced to number/string and stripped of nulls. */
  values: (number | string)[];
}

export type StatTestId =
  | 'one-sample-ttest'
  | 'independent-ttest'
  | 'paired-ttest'
  | 'one-way-anova'
  | 'chi-square'
  | 'pearson-correlation';

export interface StatTestOption {
  id: StatTestId;
  label: string;
  description: string;
  /**
   * What the user needs to pick:
   *  - 'numeric' / 'categorical': N columns of that type, compared directly (wide format —
   *    e.g. paired t-test's "before"/"after" columns, or correlation's two measurements).
   *  - 'grouped': exactly one numeric "value" column plus one categorical "group" column —
   *    the standard tidy/long-format shape most real CSVs come in (e.g. group,score).
   *    The service splits the values by group internally.
   */
  requiredColumns:
    | { count: number; type: ColumnType }
    | { kind: 'grouped'; minGroups: number };
}

/** Significance threshold — the conventional default; shown to the user, not hidden. */
export const DEFAULT_ALPHA = 0.05;

export interface StatTestResult {
  testId: StatTestId;
  testName: string;
  /** Column names the test was run on, in the order the user selected them. */
  columns: string[];
  statistic: number;
  statisticLabel: string; // e.g. "t", "F", "χ²", "r"
  degreesOfFreedom: number | [number, number];
  pValue: number;
  alpha: number;
  significant: boolean;
  /** Plain-language summary of what the result means for this data. */
  interpretation: string;
  /** Caveats surfaced to the user — small samples, assumption risk, etc. Never hidden. */
  warnings: string[];
}

/**
 * A finalized "run this test on these columns" choice — the statistics analog
 * of `ChartSelection`. Stores column names (not `DatasetColumn` objects) so it
 * stays serializable and is re-resolved against whichever dataset is active
 * when the test actually runs.
 */
export interface StatTestSelection {
  test: StatTestOption;
  /** Selected column names, in the order the test needs them (value+group for grouped tests, A/B for paired, etc). */
  columns: string[];
  /** Only meaningful for `one-sample-ttest`. */
  hypothesizedMean?: number;
  alpha: number;
}
