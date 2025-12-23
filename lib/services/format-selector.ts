import OpenAI from 'openai';
import { z } from 'zod';
import type { VisualizationType, VisualizationCategory } from '../types/visualization';
import { FORMAT_INFO } from '../types/visualization';

let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Zod schema for AI format selection response
const FormatSelectionSchema = z.object({
  visualizable: z.boolean(),
  format: z.enum([
    'network_graph',
    'mind_map',
    'tree_diagram',
    'timeline',
    'gantt_chart',
    'animated_timeline',
    'flowchart',
    'sankey_diagram',
    'swimlane_diagram',
    'line_chart',
    'bar_chart',
    'scatter_plot',
    'heatmap',
    'radar_chart',
    'pie_chart',
    'comparison_table',
    'parallel_coordinates',
    'word_cloud',
    'syntax_diagram',
    'none',
  ]),
  reason: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});

export type FormatSelectionResult = z.infer<typeof FormatSelectionSchema>;

/**
 * Comprehensive AI-powered format selection
 * Analyzes input and determines the best visualization format from all 19 options
 */
export async function selectVisualizationFormat(
  userInput: string,
  preferredFormat?: VisualizationType
): Promise<FormatSelectionResult> {
  const systemPrompt = `You are an expert AI system that analyzes content and selects the optimal visualization format.

IMPORTANT: Almost ALL content is visualizable! Be very liberal in determining what can be visualized.

HIGHLY VISUALIZABLE CONTENT INCLUDES:
- Educational topics ("explain X", "what is Y", "teach me about Z") → use mind_map or network_graph
- Concepts and their relationships → use network_graph or mind_map
- Any knowledge domain (science, history, tech, etc.) → use mind_map or network_graph
- Processes and workflows → use flowchart
- Comparisons → use comparison_table
- Data and statistics → use appropriate chart type

ONLY mark as NOT visualizable if:
- The input is completely nonsensical or empty
- The request is purely conversational ("hello", "how are you")
- The input is asking for something that can't be represented visually at all

You have access to 19 professional visualization formats across 6 categories:

CATEGORY 1: RELATIONSHIPS & NETWORKS (BEST FOR EDUCATIONAL CONTENT)
1. network_graph - Interactive node-based graphs for concepts, org structures, dependencies, knowledge graphs
2. mind_map - Hierarchical mind maps for brainstorming, note hierarchies, idea organization, EXPLAINING TOPICS
3. tree_diagram - Tree structures for hierarchies, JSON structures, file systems, org charts

CATEGORY 2: TIME & SEQUENCE
5. timeline - Interactive timelines for historical events, project milestones, data over time
6. gantt_chart - Project timelines with task dependencies and resource allocation
7. animated_timeline - Step-by-step animated progressions for evolution and morphing data

CATEGORY 3: PROCESSES & FLOWS
8. flowchart - Process flows with decision points for workflows, algorithms, decision trees
9. sankey_diagram - Flow visualization with magnitudes for conversions, energy flow, user flows
10. swimlane_diagram - Cross-functional process flows for responsibility mapping

CATEGORY 4: NUMERICAL DATA
11. line_chart - Trends over time or continuous data
12. bar_chart - Categorical comparisons and rankings
13. scatter_plot - Correlations, distributions, multi-dimensional data
14. heatmap - Density visualization, patterns, activity over time
15. radar_chart - Multi-dimensional comparisons, skill assessments
16. pie_chart - Proportions, percentages, market share

CATEGORY 5: COMPARISONS
17. comparison_table - Side-by-side feature comparisons, product comparisons
18. parallel_coordinates - Multi-dimensional data comparison across many metrics

CATEGORY 6: TEXT & CONTENT
19. word_cloud - Text frequency visualization, topic extraction, keyword visualization
20. syntax_diagram - Grammar rules, parsing logic, API structures, code syntax

ANALYSIS PROCESS:
1. Determine if the content is visualizable (default to YES for almost everything)
2. Identify the primary data pattern:
   - Educational/explanatory content → mind_map or network_graph
   - Relationships between entities → Category 1
   - Time-based or sequential → Category 2
   - Process or workflow → Category 3
   - Numerical data → Category 4
   - Comparison focus → Category 5
   - Text analysis → Category 6

3. Select the most appropriate format from the identified category
4. Provide a clear reason for your selection

Respond in JSON format:
{
  "visualizable": boolean,
  "format": "format_name" or "none",
  "reason": "clear explanation of why this format was chosen",
  "confidence": 0.0 to 1.0 (how confident you are in this choice)
}`;

  try {
    const client = getOpenAIClient();

    const userMessage = preferredFormat
      ? `${userInput}\n\nNote: User prefers ${preferredFormat} format if suitable.`
      : userInput;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(responseContent);
    const validated = FormatSelectionSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('Error in selectVisualizationFormat:', error);
    throw new Error('Failed to analyze input and select format');
  }
}

/**
 * Get format recommendations based on detected patterns
 */
export async function getFormatRecommendations(
  userInput: string
): Promise<Array<{ format: VisualizationType; score: number; reason: string }>> {
  const systemPrompt = `You are an AI that recommends visualization formats. Analyze the input and suggest the top 3 most suitable formats.

For each recommendation, provide:
- format: the format name
- score: suitability score from 0-100
- reason: why this format is suitable

Respond in JSON format:
{
  "recommendations": [
    { "format": "format_name", "score": 85, "reason": "..." },
    ...
  ]
}`;

  try {
    const client = getOpenAIClient();

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return [];
    }

    const parsed = JSON.parse(responseContent);
    return parsed.recommendations || [];
  } catch (error) {
    console.error('Error in getFormatRecommendations:', error);
    return [];
  }
}

/**
 * Detect data patterns in the input
 */
export function detectDataPatterns(input: string): {
  hasTimeComponent: boolean;
  hasNumericalData: boolean;
  hasRelationships: boolean;
  hasSequentialSteps: boolean;
  hasComparisons: boolean;
  hasTextFrequency: boolean;
} {
  const lowerInput = input.toLowerCase();

  return {
    hasTimeComponent:
      /\b(time|date|year|month|day|timeline|history|when|schedule|deadline)\b/.test(lowerInput) ||
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/.test(lowerInput) ||
      /\d{4}/.test(input), // Years

    hasNumericalData:
      /\d+\.?\d*\s*(%)/.test(input) || // Percentages
      /\$\d+/.test(input) || // Currency
      /\b\d+\b/.test(input) || // Numbers
      /\b(data|stats|statistics|metrics|values|numbers)\b/.test(lowerInput),

    hasRelationships:
      /\b(connect|link|relate|depend|parent|child|hierarchy|network|graph)\b/.test(lowerInput) ||
      /\b(and|with|to|from|between)\b/.test(lowerInput),

    hasSequentialSteps:
      /\b(step|phase|stage|process|workflow|procedure|then|next|after|before|first|second)\b/.test(lowerInput) ||
      /→|->|=>/.test(input),

    hasComparisons:
      /\b(compare|vs|versus|difference|better|worse|more|less|than)\b/.test(lowerInput) ||
      /\b(feature|product|option|alternative)\b/.test(lowerInput),

    hasTextFrequency: /\b(words|terms|frequency|common|popular|keyword)\b/.test(lowerInput),
  };
}

/**
 * Get format info by type
 */
export function getFormatInfo(type: VisualizationType) {
  return FORMAT_INFO[type];
}

/**
 * Get all formats in a category
 */
export function getFormatsByCategory(category: VisualizationCategory): VisualizationType[] {
  return Object.values(FORMAT_INFO)
    .filter((info) => info.category === category)
    .map((info) => info.id);
}
