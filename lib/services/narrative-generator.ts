// ============================================================================
// NARRATIVE GENERATOR — short AI summary alongside a chart
//
// Separate call from spec-generator so the chart-composition prompt stays
// focused on structure/data quality. Takes the already-generated `option`
// (real data, not the user's raw prompt) and writes a short, specific
// takeaway — the kind of line a PM/founder would say while presenting the
// chart, not just a description of what's on screen.
// ============================================================================

import type { EChartsOption } from 'echarts';
import { callOpenAIJSON, MODELS, type AIResult } from './ai-client';

export interface NarrativeResult {
  narrative: string;
}

const SYSTEM_PROMPT = `You are a data analyst writing a one-line takeaway for a chart shown to a business audience (PM, founder, analyst).

You'll receive the chart's title and its full ECharts \`option\`, including the real data (series values, categories, nodes, etc).

Write 1-3 sentences that surface the most useful insight: the dominant trend, the biggest mover, a notable outlier, or how a part compares to the whole. Be specific — reference real category/series names and real numbers or percentages computed from the data (round sensibly). Plain confident prose, no markdown, no bullet points, no hedging like "it appears that" or "it seems".

If the data genuinely has no clear story (flat, uniform, or too sparse), say that briefly and factually instead of inventing a trend.

Respond with ONLY valid JSON in this exact shape:
{ "narrative": "Your 1-3 sentence takeaway here." }`;

/**
 * Generates a short narrative summary for an already-composed chart spec.
 * Best-effort — callers should not let a failure here block chart generation.
 */
export async function generateNarrative(option: EChartsOption, title: string): Promise<AIResult<NarrativeResult>> {
  const userInput = JSON.stringify({ title, option });
  return callOpenAIJSON<NarrativeResult>(SYSTEM_PROMPT, userInput, MODELS.SIMPLE);
}
