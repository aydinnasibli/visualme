import type { StatTestResult } from '@/lib/types/statistics';

export function fmtStat(value: number): string {
  return Number.isFinite(value) ? value.toFixed(4) : '—';
}

export function fmtDf(df: number | [number, number]): string {
  return Array.isArray(df) ? `${df[0]}, ${df[1].toFixed(0)}` : Number.isInteger(df) ? `${df}` : df.toFixed(2);
}

export function fmtPValue(p: number): string {
  return p < 0.0001 ? '< 0.0001' : p.toFixed(4);
}

/**
 * One-line, citation-ready summary of a verified jStat result — e.g.
 * "Independent samples t-test (score vs group): t(18) = 2.3400, p = 0.0312 — significant at α = 0.05".
 * Shared by the picker modal's copy button, the FocusPanel result banner, and export captions.
 */
export function formatStatResultSummary(result: StatTestResult): string {
  const pStr = fmtPValue(result.pValue);
  const pPart = pStr.startsWith('<') ? `p ${pStr}` : `p = ${pStr}`;
  return `${result.testName} (${result.columns.join(' vs ')}): `
    + `${result.statisticLabel}(${fmtDf(result.degreesOfFreedom)}) = ${fmtStat(result.statistic)}, ${pPart} `
    + `— ${result.significant ? 'significant' : 'not significant'} at α = ${result.alpha}`;
}
