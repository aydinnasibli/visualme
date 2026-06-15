// ============================================================================
// SPEC EDITOR — single AI entry point for chart edits
//
// Replaces the old per-type `editVisualization` (19 type-specific system
// prompt branches operating on 19 different data shapes). Because every
// chart is now the same `EChartsOption` shape, one prompt can edit any of
// them — it just needs to know the structure/theme split so it doesn't
// fight the branding layer.
// ============================================================================

import type { EChartsOption } from 'echarts';
import { callOpenAIJSON, MODELS } from './ai-client';

export interface SpecEditResult {
  message: string;
  option?: EChartsOption;
  promptTokens: number;
  completionTokens: number;
}

const SYSTEM_PROMPT = `You are an expert chart-editing assistant. The user has an Apache ECharts \`option\` object and either asks a QUESTION about it or REQUESTS A CHANGE to it.

CONTEXT — STRUCTURE vs. THEME:
This option holds STRUCTURE ONLY (series types, encodings, data, axes, titles). A separate branding layer injects global colors, fonts, spacing, and legend placement on top of whatever you return — so:
- Do NOT set global \`color\`, \`backgroundColor\`, or \`textStyle\` — those belong to the brand theme and changing them here has no visible effect (the theme layer overwrites them).
- DO feel free to set per-element overrides when the user asks to highlight or distinguish specific data (e.g. "make the November bar red" → set \`itemStyle.color\` on that one data entry; "emphasize the Enterprise segment" → set \`emphasis\` on that pie slice). These are legitimate structural/semantic choices, not global theme changes.
- If the user asks for a global restyle ("make this look warmer", "use our brand colors", "bigger fonts everywhere"), explain in your "message" that appearance is controlled by the chart's brand theme settings (palette/typography/spacing), not per-chart edits, and do not modify \`option\` for that part of the request.

RULES FOR MODIFICATIONS:
1. Preserve the overall structure and chart type unless the user explicitly asks to change the chart type.
2. When adding data entries (bars, nodes, pie slices, etc.), generate realistic values consistent with the existing data's scale and domain — never placeholders.
3. When restructuring (e.g. "switch to a line chart", "show this as a treemap instead"), you may change \`series[].type\` and reshape \`data\`/axes accordingly — preserve the underlying information.
4. Return the COMPLETE updated \`option\` object, not a partial patch.
5. Keep IDs/names referenced elsewhere (e.g. graph link source/target, sankey link references) consistent with any renamed nodes.
6. Sankey \`links\` MUST remain a DAG — never introduce a chain that leads back to a node it already passed through (e.g. A→B→C→A is invalid and crashes the renderer).
7. NEVER fabricate statistical results — do not invent or add p-values, confidence intervals, test statistics (t/F/chi-square/z/etc.), significance markers (e.g. "*", "p < 0.05" labels), error bars, or significance-comparison series (e.g. a "p-value per group" line/annotation). These require a real computation you cannot perform. If the user asks for a statistical test or to show test results on the chart, set "option" to null and explain in "message" that they should use the "Run a statistical test" tool (the Σ button in the composer), which computes a verified result from the attached dataset.

Determine whether the user's message is a QUESTION or a MODIFICATION:
- QUESTION (e.g. "Why is this segment so large?", "What does this axis represent?"): answer in "message", set "option" to null.
- MODIFICATION (e.g. "Add a Q5 data point", "Switch to a donut", "Highlight the top performer"): give a brief confirmation in "message" and return the full updated option in "option".

Respond with ONLY valid JSON:
{
  "message": "string",
  "option": { ... full updated ECharts option ... } | null
}`;

interface RawEditResponse {
  message: string;
  option: EChartsOption | null;
}

/**
 * Single AI call that edits (or answers questions about) any chart, since
 * every chart now shares the same `EChartsOption` shape — no per-type
 * branching needed.
 */
export async function editChartSpec(
  existingOption: EChartsOption,
  editPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<SpecEditResult> {
  const historyContext = history.length > 0
    ? `\nPREVIOUS CONVERSATION CONTEXT:\n${history.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n`
    : '';

  const userPrompt = `EXISTING CHART OPTION:
${JSON.stringify(existingOption)}
${historyContext}
USER'S REQUEST:
${editPrompt}`;

  const { data, promptTokens, completionTokens } = await callOpenAIJSON<RawEditResponse>(
    SYSTEM_PROMPT,
    userPrompt,
    MODELS.COMPLEX
  );

  return {
    message: data.message,
    option: data.option || undefined,
    promptTokens,
    completionTokens,
  };
}
