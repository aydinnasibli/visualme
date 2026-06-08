// jStat ships no TypeScript declarations. We only use a handful of static
// methods (verified against node_modules/jstat/dist/jstat.js source — the
// vector/matrix instance API and most distributions are intentionally
// untyped here since we don't call them).
declare module 'jstat' {
  export const jStat: {
    mean(arr: number[]): number;
    stdev(arr: number[], flag?: boolean): number;
    variance(arr: number[], flag?: boolean): number;
    corrcoeff(arr1: number[], arr2: number[]): number;
    anovafscore(...groups: number[][]): number;
    anovafscore(groups: number[][]): number;
    studentt: { cdf(x: number, dof: number): number };
    centralF: { cdf(x: number, df1: number, df2: number): number };
    chisquare: { cdf(x: number, dof: number): number };
  };
}
