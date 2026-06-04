/**
 * Comprehensive Visualization Data Generator
 * Generates structured data for all 19 visualization formats using OpenAI
 */

import OpenAI from 'openai';
import type {
  VisualizationType,
  VisualizationData,
  NetworkGraphData,
  MindMapData,
  MindMapNode,
  TreeDiagramData,
  TimelineData,
  GanttChartData,
  AnimatedTimelineData,
  FlowchartData,
  SankeyDiagramData,
  SwimlaneDiagramData,
  LineChartData,
  BarChartData,
  ScatterPlotData,
  HeatmapData,
  RadarChartData,
  PieChartData,
  ComparisonTableData,
  ParallelCoordinatesData,
  WordCloudData,
  SyntaxDiagramData,
} from '../types/visualization';

// ── Model tiers ─────────────────────────────────────────────────────────────
// All operations use gpt-5.4-mini for best quality output
const MODELS = {
  COMPLEX: 'gpt-5.4-mini',
  SIMPLE:  'gpt-5.4-mini',
} as const;

// Carrier type: every AI call returns its data + real token usage for accurate billing
export interface AIResult<T> {
  data: T;
  promptTokens: number;
  completionTokens: number;
}

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

// ============================================================================
// CATEGORY 1: RELATIONSHIPS & NETWORKS
// ============================================================================

async function generateNetworkGraph(userInput: string): Promise<AIResult<NetworkGraphData>> {
  const systemPrompt = `You are an expert knowledge graph generator. Convert the user's text into a detailed network graph with rich, explorable nodes.

CRITICAL RULES:
- Nodes: Generate 10-20 key concepts.
- Descriptions: For EVERY node, write a COMPREHENSIVE 3-5 sentence description that:
  * Explains what the concept is in clear terms
  * Describes why it's important or relevant
  * Provides concrete examples or use cases
  * Connects it to the broader context
- Extendable: Mark nodes as "extendable: true" if they are complex topics that could be explored deeper with sub-concepts (e.g., broad concepts like "Machine Learning", "Cloud Computing", "Neural Networks"). Simple or specific concepts should be "extendable: false".
- Metadata: For extendable nodes, add:
  * keyPoints: Array of 3-5 key bullet points about the concept
  * relatedConcepts: Array of 3-5 related topics that could be explored
- Edges: Connect related concepts with clear relationship labels (e.g., "enables", "is composed of", "requires", "produces").
- Categories: Group nodes into 3-5 logical categories (e.g., "Core Concepts", "Tools", "Applications").

JSON Format:
{
  "nodes": [
    {
      "id": "n1",
      "label": "Concept Name",
      "description": "Comprehensive 3-5 sentence description with context, importance, examples, and connections...",
      "category": "Category Name",
      "extendable": true,
      "metadata": {
        "keyPoints": ["Key insight 1", "Key insight 2", "Key insight 3"],
        "relatedConcepts": ["Related Topic 1", "Related Topic 2", "Related Topic 3"]
      }
    }
  ],
  "edges": [{"id": "e1", "source": "n1", "target": "n2", "label": "connection type"}]
}`;

  return await callOpenAI<NetworkGraphData>(systemPrompt, userInput, MODELS.COMPLEX);
}

export async function expandNetworkNode(
  nodeLabel: string,
  nodeId: string,
  context: string,
  existingNodes: string[]
): Promise<AIResult<NetworkGraphData>> {
  const systemPrompt = `You are a knowledge graph expander. The user wants to explore the concept "${nodeLabel}" deeper.

Context: The user is visualizing "${context}".
Existing Nodes: ${existingNodes.join(', ')}.

Task:
1. Generate 4-6 NEW sub-concepts, components, or related terms specifically for "${nodeLabel}".
2. Do NOT generate nodes that are already in the "Existing Nodes" list.
3. Create edges linking the original node ID ("${nodeId}") to these new node IDs.
4. Each new node should have:
   - A comprehensive 3-5 sentence description
   - An "extendable" flag (true if it can be explored further)
   - Metadata with keyPoints and relatedConcepts for extendable nodes
5. Make descriptions detailed and informative, not generic.

JSON Format:
{
  "nodes": [
    {
      "id": "new_id_1",
      "label": "New Concept",
      "description": "Comprehensive 3-5 sentence description...",
      "category": "Deep Dive: ${nodeLabel}",
      "extendable": true,
      "metadata": {
        "keyPoints": ["Point 1", "Point 2", "Point 3"],
        "relatedConcepts": ["Concept 1", "Concept 2"]
      }
    }
  ],
  "edges": [{"id": "new_edge_1", "source": "${nodeId}", "target": "new_id_1", "label": "consists of"}]
}`;

  return await callOpenAI<NetworkGraphData>(systemPrompt, `Expand on ${nodeLabel} in the context of ${context}`, MODELS.SIMPLE);
}

async function generateMindMap(userInput: string): Promise<AIResult<MindMapData>> {
  const systemPrompt = `You are an expert mind map generator. Convert the user's text into a hierarchical mind map structure with rich, explorable nodes.

CRITICAL RULES:
- Create a tree structure with a root node and 2-4 levels deep
- Each node should have:
  * id: unique identifier (e.g., "root", "n1", "n2")
  * content: brief title/label (1-5 words)
  * description: 2-3 sentence description explaining the concept
  * children: array of child nodes (if applicable)
  * extendable: true if the concept is broad enough to explore deeper (mark 50-70% of leaf nodes as extendable)
  * metadata: for extendable nodes, include keyPoints (3-4 bullet points) and relatedConcepts (2-3 related topics)
  * level: depth in tree (0 for root, 1 for first level children, etc.)
- The root node should represent the main topic
- Organize information hierarchically from general to specific
- Keep content labels concise but descriptions comprehensive

JSON Format:
{
  "root": {
    "id": "root",
    "content": "Main Topic",
    "description": "Comprehensive description of the main topic...",
    "level": 0,
    "extendable": true,
    "metadata": {
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
      "relatedConcepts": ["Concept 1", "Concept 2"]
    },
    "children": [
      {
        "id": "n1",
        "content": "Subtopic 1",
        "description": "Description of subtopic 1...",
        "level": 1,
        "extendable": true,
        "metadata": {
          "keyPoints": ["Point 1", "Point 2"],
          "relatedConcepts": ["Related 1"]
        },
        "children": [
          {
            "id": "n1.1",
            "content": "Detail 1.1",
            "description": "Description of detail...",
            "level": 2,
            "extendable": false
          }
        ]
      }
    ]
  }
}`;

  return await callOpenAI<MindMapData>(systemPrompt, userInput, MODELS.COMPLEX);
}

export async function expandMindMapNode(
  nodeId: string,
  nodeContent: string,
  context: string,
  existingNodeIds: string[]
): Promise<AIResult<MindMapNode[]>> {
  const systemPrompt = `You are a mind map expander. The user wants to explore the concept "${nodeContent}" deeper by adding child nodes.

Context: The user is visualizing "${context}".
Existing Node IDs: ${existingNodeIds.join(', ')}.
Parent Node ID: ${nodeId}

Task:
1. Generate 3-5 NEW child nodes that expand on "${nodeContent}".
2. Do NOT generate nodes with IDs that are already in the "Existing Node IDs" list.
3. Use ID format: "${nodeId}.1", "${nodeId}.2", "${nodeId}.3", etc.
4. Each new node should have:
   - id: unique identifier following the format above
   - content: brief title (1-5 words)
   - description: comprehensive 2-3 sentence description
   - level: parent's level + 1
   - extendable: true if it can be explored further (mark 50-70% as extendable)
   - metadata: for extendable nodes, include keyPoints and relatedConcepts
   - children: empty array or omit (these are new leaf nodes)
5. Make descriptions detailed and informative, not generic.

JSON Format - Return ONLY an array of nodes:
[
  {
    "id": "${nodeId}.1",
    "content": "Sub-concept 1",
    "description": "Comprehensive 2-3 sentence description...",
    "level": <parent_level + 1>,
    "extendable": true,
    "metadata": {
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "relatedConcepts": ["Concept 1", "Concept 2"]
    }
  },
  {
    "id": "${nodeId}.2",
    "content": "Sub-concept 2",
    "description": "Comprehensive description...",
    "level": <parent_level + 1>,
    "extendable": false
  }
]`;

  const { data: result, promptTokens, completionTokens } = await callOpenAI<{ nodes?: MindMapNode[] } | MindMapNode[]>(
    systemPrompt,
    `Expand on "${nodeContent}" in the context of "${context}"`,
    MODELS.SIMPLE
  );

  const nodes = Array.isArray(result)
    ? result
    : ((result as { nodes?: MindMapNode[] }).nodes || []);

  return { data: nodes, promptTokens, completionTokens };
}

async function generateTreeDiagram(userInput: string): Promise<AIResult<TreeDiagramData>> {
  const systemPrompt = `Convert text into a hierarchical tree diagram structure with rich attributes.

Rules:
- Root node with children
- Each node must have:
  * name: brief label (required)
  * attributes: object containing:
    - description: comprehensive 2-3 sentence description (required)
    - extendable: boolean (true if concept can be explored deeper)
  * children: array of child nodes (optional)
- Represent clear hierarchy
- Maximum 5 levels deep

JSON format:
{
  "name": "Root",
  "attributes": {
    "description": "Description of root...",
    "extendable": true
  },
  "children": [
    {
      "name": "Child 1",
      "attributes": {
        "description": "Description of child 1...",
        "extendable": false
      },
      "children": [{"name": "Grandchild 1"}]
    }
  ]
}`;

  return await callOpenAI<TreeDiagramData>(systemPrompt, userInput, MODELS.COMPLEX);
}

// ============================================================================
// CATEGORY 2: TIME & SEQUENCE
// ============================================================================

async function generateTimeline(userInput: string): Promise<AIResult<TimelineData>> {
  const systemPrompt = `Create a rich historical or project timeline.

Rules:
- Generate 10-20 timeline items covering the scope of the topic
- items: {id, content, start (ISO date), end (optional), group (optional), type: 'point'|'range'}
- groups: Define 2-4 groups if the topic has parallel tracks (e.g. "Technology", "Politics")
- Use 'range' type for periods, 'point' for specific events
- Dates MUST be YYYY-MM-DD format

JSON format:
{
  "items": [
    {"id": "1", "content": "Invention of X", "start": "1995-05-20", "type": "point", "group": "tech"},
    {"id": "2", "content": "Golden Era", "start": "1998-01-01", "end": "2005-12-31", "type": "range", "group": "era"}
  ],
  "groups": [
    {"id": "tech", "content": "Technology"},
    {"id": "era", "content": "Eras"}
  ]
}`;

  return await callOpenAI<TimelineData>(systemPrompt, userInput, MODELS.COMPLEX);
}

async function generateGanttChart(userInput: string): Promise<AIResult<GanttChartData>> {
  const systemPrompt = `Create Gantt chart data for project planning and scheduling.

Rules:
- tasks: array of {id, name, start (YYYY-MM-DD), end (YYYY-MM-DD), progress (always 0), dependencies (array of task IDs), type (optional: 'task'|'milestone'|'project', default 'task')}
- Dependencies show task relationships (which tasks must complete before others can start)
- Use 'milestone' for zero-duration events (same start/end date), 'project' for grouping, 'task' for normal work items
- Ensure dates are logical (start <= end)
- Set progress to 0 for all tasks (progress tracking not used in planning phase)
- Create realistic task durations and logical dependencies

JSON format:
{
  "tasks": [
    {"id": "task1", "name": "Research Phase", "start": "2025-01-06", "end": "2025-01-12", "progress": 0, "dependencies": [], "type": "task"},
    {"id": "task2", "name": "Planning", "start": "2025-01-13", "end": "2025-01-19", "progress": 0, "dependencies": ["task1"], "type": "task"},
    {"id": "m1", "name": "Midpoint Review", "start": "2025-02-03", "end": "2025-02-03", "progress": 0, "dependencies": ["task2"], "type": "milestone"}
  ]
}`;

  return await callOpenAI<GanttChartData>(systemPrompt, userInput, MODELS.COMPLEX);
}

async function generateAnimatedTimeline(userInput: string): Promise<AIResult<AnimatedTimelineData>> {
  const systemPrompt = `Create animated timeline sequence data.

Rules:
- steps: array of {id, title, description, timestamp (optional), data (optional)}
- Represents progression or evolution
- Each step is a frame in the animation

JSON format:
{
  "steps": [
    {"id": "1", "title": "Step 1", "description": "First phase", "timestamp": "2020"},
    {"id": "2", "title": "Step 2", "description": "Second phase", "timestamp": "2022"}
  ]
}`;

  return await callOpenAI<AnimatedTimelineData>(systemPrompt, userInput, MODELS.COMPLEX);
}

// ============================================================================
// CATEGORY 3: PROCESSES & FLOWS
// ============================================================================

async function generateFlowchart(userInput: string): Promise<AIResult<FlowchartData>> {
  const systemPrompt = `Create flowchart data for process visualization.

Rules:
- nodes: array of {id, type ('start'|'end'|'process'|'decision'|'input'|'output'), data: {label}, position: {x, y}}
- edges: array of {id, source, target, label (optional)}
- Position: x,y coordinates (start at 0, increment by 100-200)
- Must have at least one 'start' and one 'end' node

JSON format:
{
  "nodes": [
    {"id": "1", "type": "start", "data": {"label": "Start"}, "position": {"x": 0, "y": 0}},
    {"id": "2", "type": "process", "data": {"label": "Process"}, "position": {"x": 0, "y": 100}},
    {"id": "3", "type": "decision", "data": {"label": "Decision?"}, "position": {"x": 0, "y": 200}}
  ],
  "edges": [
    {"id": "e1", "source": "1", "target": "2"},
    {"id": "e2", "source": "2", "target": "3", "label": "Yes"}
  ]
}`;

  return await callOpenAI<FlowchartData>(systemPrompt, userInput, MODELS.COMPLEX);
}

async function generateSankeyDiagram(userInput: string): Promise<AIResult<SankeyDiagramData>> {
  const systemPrompt = `Create Sankey diagram data for flow visualization.

Rules:
- nodes: array of {id, name}
- links: array of {source (node id or index), target (node id or index), value (flow magnitude)}
- Value represents flow quantity/magnitude

JSON format:
{
  "nodes": [{"id": "visitors", "name": "Visitors"}, {"id": "leads", "name": "Leads"}],
  "links": [{"source": "visitors", "target": "leads", "value": 1000}]
}`;

  return await callOpenAI<SankeyDiagramData>(systemPrompt, userInput, MODELS.COMPLEX);
}

async function generateSwimlaneDiagram(userInput: string): Promise<AIResult<SwimlaneDiagramData>> {
  const systemPrompt = `Create swimlane diagram data for cross-functional processes.

Rules:
- lanes: array of {id, name} representing roles/departments
- tasks: array of {id, lane (lane id), content, position (order in lane)}

JSON format:
{
  "lanes": [{"id": "dev", "name": "Developer"}, {"id": "qa", "name": "QA"}],
  "tasks": [
    {"id": "t1", "lane": "dev", "content": "Write code", "position": 0},
    {"id": "t2", "lane": "qa", "content": "Test", "position": 1}
  ]
}`;

  return await callOpenAI<SwimlaneDiagramData>(systemPrompt, userInput, MODELS.COMPLEX);
}

// ============================================================================
// CATEGORY 4: NUMERICAL DATA
// ============================================================================

async function generateLineChart(userInput: string): Promise<AIResult<LineChartData>> {
  const systemPrompt = `Create line chart data for trends visualization.

Rules:
- data: array of objects with 'name' (x-axis label) and numeric values
- lines: array of metric names to plot
- Good for time-series and trends

JSON format:
{
  "data": [
    {"name": "Jan", "revenue": 4000, "expenses": 2400},
    {"name": "Feb", "revenue": 3000, "expenses": 1398}
  ],
  "lines": ["revenue", "expenses"]
}`;

  return await callOpenAI<LineChartData>(systemPrompt, userInput, MODELS.SIMPLE);
}

async function generateBarChart(userInput: string): Promise<AIResult<BarChartData>> {
  const systemPrompt = `Create bar chart data for categorical comparisons.

Rules:
- data: array of objects with 'name' (category) and numeric values
- bars: array of metric names to display as bars

JSON format:
{
  "data": [
    {"name": "Product A", "sales": 4000, "target": 3500},
    {"name": "Product B", "sales": 3000, "target": 4000}
  ],
  "bars": ["sales", "target"]
}`;

  return await callOpenAI<BarChartData>(systemPrompt, userInput, MODELS.SIMPLE);
}

async function generateScatterPlot(userInput: string): Promise<AIResult<ScatterPlotData>> {
  const systemPrompt = `Create scatter plot data for correlation visualization.

Rules:
- data: array of {x (number), y (number), z (optional size), name (optional), category (optional)}
- Shows relationships between variables

JSON format:
{
  "data": [
    {"x": 10, "y": 20, "z": 5, "name": "Point 1", "category": "Group A"},
    {"x": 15, "y": 25, "z": 8, "name": "Point 2", "category": "Group B"}
  ]
}`;

  return await callOpenAI<ScatterPlotData>(systemPrompt, userInput, MODELS.SIMPLE);
}

async function generateHeatmap(userInput: string): Promise<AIResult<HeatmapData>> {
  const systemPrompt = `Create heatmap data for density visualization.

Rules:
- data: array of {x (string|number), y (string|number), value (number for intensity)}
- Shows patterns and density

JSON format:
{
  "data": [
    {"x": "Mon", "y": "9AM", "value": 45},
    {"x": "Mon", "y": "10AM", "value": 78},
    {"x": "Tue", "y": "9AM", "value": 32}
  ]
}`;

  return await callOpenAI<HeatmapData>(systemPrompt, userInput, MODELS.SIMPLE);
}

async function generateRadarChart(userInput: string): Promise<AIResult<RadarChartData>> {
  const systemPrompt = `Create radar chart data for multi-dimensional comparison.

Rules:
- data: array of objects with 'subject' (dimension name) and metric values
- metrics: array of metric names
- Good for comparing multiple dimensions

JSON format:
{
  "data": [
    {"subject": "Speed", "productA": 85, "productB": 75},
    {"subject": "Quality", "productA": 90, "productB": 95}
  ],
  "metrics": ["productA", "productB"]
}`;

  return await callOpenAI<RadarChartData>(systemPrompt, userInput, MODELS.SIMPLE);
}

async function generatePieChart(userInput: string): Promise<AIResult<PieChartData>> {
  const systemPrompt = `Create pie chart data for proportions visualization.

Rules:
- data: array of {name, value (number), color (optional hex)}
- Values represent proportions or percentages

JSON format:
{
  "data": [
    {"name": "Category A", "value": 35, "color": "#8884d8"},
    {"name": "Category B", "value": 25, "color": "#82ca9d"},
    {"name": "Category C", "value": 40}
  ]
}`;

  return await callOpenAI<PieChartData>(systemPrompt, userInput, MODELS.SIMPLE);
}

// ============================================================================
// CATEGORY 5: COMPARISONS
// ============================================================================

async function generateComparisonTable(userInput: string): Promise<AIResult<ComparisonTableData>> {
  const systemPrompt = `Create comparison table data.

Rules:
- columns: array of {id, header, accessorKey}
- data: array of objects matching accessorKey
- Good for feature comparisons

JSON format:
{
  "columns": [
    {"id": "feature", "header": "Feature", "accessorKey": "feature"},
    {"id": "productA", "header": "Product A", "accessorKey": "productA"}
  ],
  "data": [
    {"feature": "Speed", "productA": "Fast", "productB": "Very Fast"},
    {"feature": "Price", "productA": "$99", "productB": "$149"}
  ]
}`;

  return await callOpenAI<ComparisonTableData>(systemPrompt, userInput, MODELS.COMPLEX);
}

async function generateParallelCoordinates(userInput: string): Promise<AIResult<ParallelCoordinatesData>> {
  const systemPrompt = `Create parallel coordinates data for multi-dimensional comparison.

Rules:
- data: array of objects with numeric values for each dimension
- dimensions: array of dimension names (must match object keys)

JSON format:
{
  "data": [
    {"speed": 85, "quality": 90, "price": 75, "durability": 88},
    {"speed": 70, "quality": 95, "price": 85, "durability": 92}
  ],
  "dimensions": ["speed", "quality", "price", "durability"]
}`;

  return await callOpenAI<ParallelCoordinatesData>(systemPrompt, userInput, MODELS.SIMPLE);
}

// ============================================================================
// CATEGORY 6: TEXT & CONTENT
// ============================================================================

async function generateWordCloud(userInput: string): Promise<AIResult<WordCloudData>> {
  const systemPrompt = `Create word cloud data for text frequency visualization.

Rules:
- words: array of {text (word), value (frequency/importance)}
- Extract key terms and their importance
- Value determines word size

JSON format:
{
  "words": [
    {"text": "machine", "value": 85},
    {"text": "learning", "value": 75},
    {"text": "data", "value": 60}
  ]
}`;

  // Using d3-cloud (industry standard, actively maintained)
  // Component will use d3-cloud for layout + custom React rendering
  return await callOpenAI<WordCloudData>(systemPrompt, userInput, MODELS.SIMPLE);
}

async function generateSyntaxDiagram(userInput: string): Promise<AIResult<SyntaxDiagramData>> {
  const systemPrompt = `Create syntax diagram data for grammar/syntax visualization.

Rules:
- syntax: brief description of what syntax this represents
- rules: array of {name (rule name), pattern (syntax pattern)}
- Good for showing code/language syntax

JSON format:
{
  "syntax": "Python function definition",
  "rules": [
    {"name": "function", "pattern": "def function_name(parameters):"},
    {"name": "parameters", "pattern": "param1, param2, ..."}
  ]
}`;

  return await callOpenAI<SyntaxDiagramData>(systemPrompt, userInput, MODELS.SIMPLE);
}

// ============================================================================
// HELPER FUNCTION
// ============================================================================

async function callOpenAI<T>(
  systemPrompt: string,
  userInput: string,
  model: string = MODELS.SIMPLE
): Promise<AIResult<T>> {
  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 16384, // hard cap — prevents runaway output costs
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    return {
      data: JSON.parse(responseContent) as T,
      promptTokens:     completion.usage?.prompt_tokens     ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
    };
  } catch (error) {
    console.error('Error in OpenAI call:', error);
    throw new Error(`Failed to generate visualization data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// MAIN GENERATION ROUTER
// ============================================================================

export async function generateVisualizationData(
  type: VisualizationType,
  userInput: string
): Promise<AIResult<VisualizationData>> {
  switch (type) {
    case 'network_graph':       return await generateNetworkGraph(userInput);
    case 'mind_map':            return await generateMindMap(userInput);
    case 'tree_diagram':        return await generateTreeDiagram(userInput);
    case 'timeline':            return await generateTimeline(userInput);
    case 'gantt_chart':         return await generateGanttChart(userInput);
    case 'animated_timeline':   return await generateAnimatedTimeline(userInput);
    case 'flowchart':           return await generateFlowchart(userInput);
    case 'sankey_diagram':      return await generateSankeyDiagram(userInput);
    case 'swimlane_diagram':    return await generateSwimlaneDiagram(userInput);
    case 'line_chart':          return await generateLineChart(userInput);
    case 'bar_chart':           return await generateBarChart(userInput);
    case 'scatter_plot':        return await generateScatterPlot(userInput);
    case 'heatmap':             return await generateHeatmap(userInput);
    case 'radar_chart':         return await generateRadarChart(userInput);
    case 'pie_chart':           return await generatePieChart(userInput);
    case 'comparison_table':    return await generateComparisonTable(userInput);
    case 'parallel_coordinates':return await generateParallelCoordinates(userInput);
    case 'word_cloud':          return await generateWordCloud(userInput);
    case 'syntax_diagram':      return await generateSyntaxDiagram(userInput);
    default:
      throw new Error(`Unsupported visualization type: ${type}`);
  }
}

// ============================================================================
// VISUALIZATION GENERATOR SERVICE CLASS
// ============================================================================

export class VisualizationGeneratorService {
  /**
   * Edit an existing visualization using AI.
   * Returns the assistant message, optional updated data, and real token usage.
   */
  async editVisualization(
    type: VisualizationType,
    existingData: VisualizationData,
    editPrompt: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<{ message: string; data?: VisualizationData; promptTokens: number; completionTokens: number }> {
    const systemPrompt = this.getEditSystemPrompt(type);

    // Format history for context, limited to last 5 turns to save context window
    const historyContext = history.length > 0
      ? `\nPREVIOUS CONVERSATION CONTEXT:\n${history.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n`
      : '';

    const userPrompt = `EXISTING VISUALIZATION DATA:
${JSON.stringify(existingData)}
${historyContext}
USER'S REQUEST:
${editPrompt}

Determine if this is a QUESTION about the data or a REQUEST TO MODIFY the data.

1. If it is a QUESTION (e.g. "Why is node X red?", "What does this represent?", "How many nodes?"):
   - Return "message": The answer to the question.
   - Return "data": null (do not modify data).

2. If it is a MODIFICATION (e.g. "Make node X blue", "Add a step", "Change layout"):
   - Return "message": A brief confirmation (e.g. "I've updated the color...").
   - Return "data": The complete updated JSON with the requested changes.

Return valid JSON:
{
  "message": "string",
  "data": object | null
}`;

    const { data: response, promptTokens, completionTokens } = await callOpenAI<{
      message: string;
      data: VisualizationData | null;
    }>(systemPrompt, userPrompt, MODELS.COMPLEX);

    return {
      message: response.message,
      data: response.data || undefined,
      promptTokens,
      completionTokens,
    };
  }

  private getEditSystemPrompt(type: VisualizationType): string {
    const basePrompt = `You are an expert visualization assistant. Your task is to either answer questions about the data OR modify the visualization data based on user requests.

CRITICAL RULES FOR MODIFICATIONS:
1. PRESERVE the general JSON structure of the original visualization.
2. YOU ARE ALLOWED AND ENCOURAGED to modify visual attributes (color, size, style) if the user asks.
   - For Mind Maps/Graphs: 'color' is a valid property on nodes. Use hex codes (e.g., "#3b82f6" for blue).
3. If adding new items, generate appropriate unique IDs.
4. Ensure all modifications are logical.
5. Return COMPLETE updated data, not just the changes.
6. If the user asks for "blue", use a nice shade like #3b82f6 or #60a5fa, not just "blue".`;

    const typeSpecificPrompts: Record<VisualizationType, string> = {
      network_graph: `${basePrompt}

For network graphs:
- Nodes support 'color', 'size', 'category'.
- If user wants to change color, update the 'color' field of the node(s).
- When adding nodes, ensure unique IDs and proper category assignment.
- When modifying connections, maintain edge source/target validity.`,

      gantt_chart: `${basePrompt}

For Gantt charts:
- Tasks support 'custom_class' for styling (e.g., 'bar-milestone', 'bar-active').
- Maintain date format (YYYY-MM-DD).
- Ensure task dependencies reference valid task IDs.`,

      mind_map: `${basePrompt}

For mind maps:
- Nodes support 'color' attribute. If user says "make it blue", set "color": "#3b82f6".
- Maintain hierarchical parent-child relationships.
- Keep the tree structure valid.`,

      timeline: `${basePrompt}

For timelines:
- Maintain chronological order
- Preserve date formats
- Keep event structure consistent`,

      tree_diagram: `${basePrompt}

For tree diagrams:
- Maintain parent-child relationships
- Preserve tree structure validity
- Keep node attributes consistent`,

      animated_timeline: basePrompt,
      flowchart: basePrompt,
      sankey_diagram: basePrompt,
      swimlane_diagram: basePrompt,
      line_chart: basePrompt,
      bar_chart: basePrompt,
      scatter_plot: basePrompt,
      heatmap: basePrompt,
      radar_chart: basePrompt,
      pie_chart: basePrompt,
      comparison_table: basePrompt,
      parallel_coordinates: basePrompt,
      word_cloud: basePrompt,
      syntax_diagram: basePrompt,
    };

    return typeSpecificPrompts[type] || basePrompt;
  }
}
