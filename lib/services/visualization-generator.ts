/**
 * Comprehensive Visualization Data Generator
 * Generates structured data for all 19 visualization formats using OpenAI
 */

import OpenAI from 'openai';
import { z } from 'zod';
import type {
  VisualizationType,
  VisualizationData,
  NetworkGraphData,
  TreeDiagramData,
  ForceDirectedGraphData,
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

export async function generateNetworkGraph(userInput: string): Promise<NetworkGraphData> {
  const systemPrompt = `You are an AI that converts text into network graph data.

Create a network graph with nodes and edges representing concepts and their relationships.

Rules:
- Each node: id (unique), label (short name), description (optional), category (optional)
- Each edge: id (unique), source (node id), target (node id), label (optional)
- Create meaningful relationships
- Use clear, concise labels
- Maximum 20 nodes for clarity
- Ensure all edge source/target IDs exist in nodes

JSON format:
{
  "nodes": [{"id": "node1", "label": "Label", "description": "...", "category": "..."}],
  "edges": [{"id": "edge1", "source": "node1", "target": "node2", "label": "..."}]
}`;

  return await callOpenAI<NetworkGraphData>(systemPrompt, userInput, 'gpt-4o-mini');
}

export async function generateMindMap(userInput: string): Promise<string> {
  const systemPrompt = `You are an AI that converts text into mind map markdown format.

Create a hierarchical mind map structure using markdown.

Rules:
- Use markdown headers (# for main, ## for sub, ### for details)
- Maximum 4 levels deep
- Keep it organized and logical

Example:
# Main Topic
## Subtopic 1
### Detail 1.1
### Detail 1.2
## Subtopic 2

Respond with ONLY markdown, no additional text.`;

  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput },
    ],
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content?.trim() || '# Error\nFailed to generate mind map';
}

export async function generateTreeDiagram(userInput: string): Promise<TreeDiagramData> {
  const systemPrompt = `Convert text into a hierarchical tree diagram structure.

Rules:
- Root node with children
- Each node: name (required), children (optional array), value (optional number)
- Represent clear hierarchy
- Maximum 5 levels deep

JSON format:
{
  "name": "Root",
  "children": [
    {
      "name": "Child 1",
      "children": [{"name": "Grandchild 1"}, {"name": "Grandchild 2"}]
    },
    {"name": "Child 2"}
  ]
}`;

  return await callOpenAI<TreeDiagramData>(systemPrompt, userInput, 'gpt-4o-mini');
}

export async function generateForceDirectedGraph(userInput: string): Promise<ForceDirectedGraphData> {
  const systemPrompt = `Create a force-directed graph for complex network visualization.

Rules:
- nodes: array of {id, name, group (number for clustering), val (size)}
- links: array of {source (node id), target (node id), value (strength)}
- Groups cluster related nodes
- Value determines node size/link strength

JSON format:
{
  "nodes": [{"id": "1", "name": "Node 1", "group": 1, "val": 10}],
  "links": [{"source": "1", "target": "2", "value": 5}]
}`;

  return await callOpenAI<ForceDirectedGraphData>(systemPrompt, userInput, 'gpt-4o-mini');
}

// ============================================================================
// CATEGORY 2: TIME & SEQUENCE
// ============================================================================

export async function generateTimeline(userInput: string): Promise<TimelineData> {
  const systemPrompt = `Create timeline data for temporal visualization.

Rules:
- items: array of {id, content, start (ISO date), end (optional), group (optional), type: 'point'|'range'}
- groups (optional): array of {id, content}
- Use ISO date format: "2024-01-15" or "2024-01-15T10:00:00"

JSON format:
{
  "items": [
    {"id": "1", "content": "Event 1", "start": "2024-01-15", "type": "point"},
    {"id": "2", "content": "Period", "start": "2024-02-01", "end": "2024-03-01", "type": "range"}
  ],
  "groups": [{"id": "g1", "content": "Group 1"}]
}`;

  return await callOpenAI<TimelineData>(systemPrompt, userInput, 'gpt-4o-mini');
}

export async function generateGanttChart(userInput: string): Promise<GanttChartData> {
  const systemPrompt = `Create Gantt chart data for project timelines.

Rules:
- tasks: array of {id, name, start (YYYY-MM-DD), end (YYYY-MM-DD), progress (0-100), dependencies (array of task IDs)}
- Dependencies show task relationships

JSON format:
{
  "tasks": [
    {"id": "task1", "name": "Design", "start": "2024-01-01", "end": "2024-01-15", "progress": 75, "dependencies": []},
    {"id": "task2", "name": "Development", "start": "2024-01-16", "end": "2024-02-28", "progress": 30, "dependencies": ["task1"]}
  ]
}`;

  return await callOpenAI<GanttChartData>(systemPrompt, userInput, 'gpt-4o-mini');
}

export async function generateAnimatedTimeline(userInput: string): Promise<AnimatedTimelineData> {
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

  return await callOpenAI<AnimatedTimelineData>(systemPrompt, userInput, 'gpt-4o-mini');
}

// ============================================================================
// CATEGORY 3: PROCESSES & FLOWS
// ============================================================================

export async function generateFlowchart(userInput: string): Promise<FlowchartData> {
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

  return await callOpenAI<FlowchartData>(systemPrompt, userInput, 'gpt-4o-mini');
}

export async function generateSankeyDiagram(userInput: string): Promise<SankeyDiagramData> {
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

  return await callOpenAI<SankeyDiagramData>(systemPrompt, userInput, 'gpt-4o-mini');
}

export async function generateSwimlaneDiagram(userInput: string): Promise<SwimlaneDiagramData> {
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

  return await callOpenAI<SwimlaneDiagramData>(systemPrompt, userInput, 'gpt-4o-mini');
}

// ============================================================================
// CATEGORY 4: NUMERICAL DATA
// ============================================================================

export async function generateLineChart(userInput: string): Promise<LineChartData> {
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

  return await callOpenAI<LineChartData>(systemPrompt, userInput, 'gpt-4o-mini');
}

export async function generateBarChart(userInput: string): Promise<BarChartData> {
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

  return await callOpenAI<BarChartData>(systemPrompt, userInput, 'gpt-4o-mini');
}

export async function generateScatterPlot(userInput: string): Promise<ScatterPlotData> {
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

  return await callOpenAI<ScatterPlotData>(systemPrompt, userInput, 'gpt-4o-mini');
}

export async function generateHeatmap(userInput: string): Promise<HeatmapData> {
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

  return await callOpenAI<HeatmapData>(systemPrompt, userInput, 'gpt-4o-mini');
}

export async function generateRadarChart(userInput: string): Promise<RadarChartData> {
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

  return await callOpenAI<RadarChartData>(systemPrompt, userInput, 'gpt-4o-mini');
}

export async function generatePieChart(userInput: string): Promise<PieChartData> {
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

  return await callOpenAI<PieChartData>(systemPrompt, userInput, 'gpt-4o-mini');
}

// ============================================================================
// CATEGORY 5: COMPARISONS
// ============================================================================

export async function generateComparisonTable(userInput: string): Promise<ComparisonTableData> {
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

  return await callOpenAI<ComparisonTableData>(systemPrompt, userInput, 'gpt-4o-mini');
}

export async function generateParallelCoordinates(userInput: string): Promise<ParallelCoordinatesData> {
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

  return await callOpenAI<ParallelCoordinatesData>(systemPrompt, userInput, 'gpt-4o-mini');
}

// ============================================================================
// CATEGORY 6: TEXT & CONTENT
// ============================================================================

export async function generateWordCloud(userInput: string): Promise<WordCloudData> {
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

  return await callOpenAI<WordCloudData>(systemPrompt, userInput, 'gpt-4o-mini');
}

export async function generateSyntaxDiagram(userInput: string): Promise<SyntaxDiagramData> {
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

  return await callOpenAI<SyntaxDiagramData>(systemPrompt, userInput, 'gpt-4o-mini');
}

// ============================================================================
// HELPER FUNCTION
// ============================================================================

async function callOpenAI<T>(systemPrompt: string, userInput: string, model: string = 'gpt-4o-mini'): Promise<T> {
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
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(responseContent) as T;
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
): Promise<VisualizationData> {
  switch (type) {
    case 'network_graph':
      return await generateNetworkGraph(userInput);
    case 'mind_map':
      return await generateMindMap(userInput);
    case 'tree_diagram':
      return await generateTreeDiagram(userInput);
    case 'force_directed_graph':
      return await generateForceDirectedGraph(userInput);
    case 'timeline':
      return await generateTimeline(userInput);
    case 'gantt_chart':
      return await generateGanttChart(userInput);
    case 'animated_timeline':
      return await generateAnimatedTimeline(userInput);
    case 'flowchart':
      return await generateFlowchart(userInput);
    case 'sankey_diagram':
      return await generateSankeyDiagram(userInput);
    case 'swimlane_diagram':
      return await generateSwimlaneDiagram(userInput);
    case 'line_chart':
      return await generateLineChart(userInput);
    case 'bar_chart':
      return await generateBarChart(userInput);
    case 'scatter_plot':
      return await generateScatterPlot(userInput);
    case 'heatmap':
      return await generateHeatmap(userInput);
    case 'radar_chart':
      return await generateRadarChart(userInput);
    case 'pie_chart':
      return await generatePieChart(userInput);
    case 'comparison_table':
      return await generateComparisonTable(userInput);
    case 'parallel_coordinates':
      return await generateParallelCoordinates(userInput);
    case 'word_cloud':
      return await generateWordCloud(userInput);
    case 'syntax_diagram':
      return await generateSyntaxDiagram(userInput);
    default:
      throw new Error(`Unsupported visualization type: ${type}`);
  }
}
