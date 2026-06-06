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
  const systemPrompt = `Convert text into a rich, detailed hierarchical tree diagram.

CRITICAL RULES:
- Aim for 20-35 total nodes giving a comprehensive view of the topic
- Root node with 3-6 direct children; each internal child should have 2-5 grandchildren
- Each node MUST have:
  * name: concise label (2-6 words, required)
  * attributes: object containing:
    - description: 2-3 sentence explanation of what this node represents and why it matters (required)
    - type: short category/type label (e.g., "Core Concept", "Component", "Phase", "Module")
    - extendable: boolean (true if concept warrants deeper exploration)
    - keyPoints: array of 2-4 key facts (for top-level and important nodes)
  * children: array of child nodes (optional for leaf nodes)
- Maximum 5 levels deep — keep hierarchy meaningful
- Leaf nodes need at minimum name, description, type, and extendable

JSON format:
{
  "name": "Root Concept",
  "attributes": {
    "description": "Comprehensive overview of what this diagram covers and why it matters...",
    "type": "Root",
    "extendable": true,
    "keyPoints": ["Key fact 1", "Key fact 2", "Key fact 3"]
  },
  "children": [
    {
      "name": "Major Branch",
      "attributes": {
        "description": "What this branch covers and its significance...",
        "type": "Category",
        "extendable": true,
        "keyPoints": ["Fact 1", "Fact 2"]
      },
      "children": [
        {
          "name": "Leaf Node",
          "attributes": {
            "description": "Specific detail and its role...",
            "type": "Component",
            "extendable": false
          }
        }
      ]
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
  const systemPrompt = `Create a rich animated timeline with detailed, educational step content.

CRITICAL RULES:
- Generate 6-12 meaningful, chronological steps
- steps: array of {id, title, description, timestamp, keyPoints, impact}
- Each step MUST have:
  * id: unique identifier
  * title: concise phase/event name (2-6 words)
  * description: COMPREHENSIVE 3-5 sentence description that explains what happened, why it was significant, who was involved, and what changed as a result. Never use placeholder text like "First phase" — always provide real, specific information.
  * timestamp: specific date, year, or time range (e.g., "1969", "Q3 2008", "March 2020")
  * keyPoints: array of 3-5 specific facts, milestones, or details about this step
  * impact: 1-2 sentence statement about the lasting significance or consequence of this step
- Represents a meaningful progression with genuine educational and informational value

JSON format:
{
  "steps": [
    {
      "id": "1",
      "title": "Foundation & Origins",
      "description": "Detailed 3-5 sentence description of this specific phase, including what happened, who was involved, the context and challenges, and why this moment was pivotal to the overall narrative...",
      "timestamp": "1950-1960",
      "keyPoints": ["Specific fact or milestone 1", "Key achievement or challenge 2", "Important figure or decision 3", "Measurable outcome or statistic 4"],
      "impact": "This phase fundamentally changed X by establishing Y, which became the foundation for all subsequent developments."
    }
  ]
}`;

  return await callOpenAI<AnimatedTimelineData>(systemPrompt, userInput, MODELS.COMPLEX);
}

// ============================================================================
// CATEGORY 3: PROCESSES & FLOWS
// ============================================================================

async function generateFlowchart(userInput: string): Promise<AIResult<FlowchartData>> {
  const systemPrompt = `Create a detailed, informative flowchart for process visualization with rich node metadata.

CRITICAL RULES:
- Generate 8-16 nodes to fully cover the process
- nodes: array of {id, type ('start'|'end'|'process'|'decision'|'input'|'output'), data: {label, description, keyPoints, relatedConcepts}, position: {x, y}}
- For EVERY node, data MUST include:
  * label: concise name (2-6 words)
  * description: COMPREHENSIVE 2-3 sentence explanation of what happens at this step, why it matters, and what the output or outcome is
  * keyPoints: array of 3-5 specific, actionable bullet points about this step (conditions checked, actions performed, validations, outputs)
  * relatedConcepts: array of 2-3 related steps, tools, or concepts relevant to this node
- edges: array of {id, source, target, label (optional — use for Yes/No branches, condition labels, action names)}
- Position: x,y coordinates (start at 0,0, increment y by 150-200 for vertical flow, use x offsets ±250 for branches)
- Must have at least one 'start' and one 'end' node
- Decision nodes must always have at least 2 outgoing edges labeled with conditions

JSON format:
{
  "nodes": [
    {
      "id": "1",
      "type": "start",
      "data": {
        "label": "Process Initiated",
        "description": "The process begins when a trigger event occurs. This entry point validates that all prerequisites are met before proceeding to the next stage.",
        "keyPoints": ["Triggered by user action or system event", "Validates required inputs are present", "Initializes the process state", "Logs the start timestamp"],
        "relatedConcepts": ["Trigger Condition", "Prerequisites Check", "Process State"]
      },
      "position": {"x": 0, "y": 0}
    }
  ],
  "edges": [
    {"id": "e1", "source": "1", "target": "2"},
    {"id": "e2", "source": "3", "target": "4", "label": "Yes"},
    {"id": "e3", "source": "3", "target": "5", "label": "No"}
  ]
}`;

  return await callOpenAI<FlowchartData>(systemPrompt, userInput, MODELS.COMPLEX);
}

async function generateSankeyDiagram(userInput: string): Promise<AIResult<SankeyDiagramData>> {
  const systemPrompt = `Create a detailed Sankey diagram showing realistic multi-stage flow with meaningful magnitudes.

CRITICAL RULES:
- nodes: 8-15 nodes representing stages, categories, or entities in the flow
- links: Connect nodes with realistic flow values that represent actual proportions
- Flow conservation: total inflow ≈ total outflow for intermediate nodes (values balance across stages)
- Values should be realistic and in the same unit (e.g., percentages out of 1000, actual user counts, dollars)
- Organize nodes left-to-right: source → intermediate stages → destinations
- Node names should be descriptive, clear, and specific to the topic
- Create at least 3 "columns" or stages for a rich flow visualization
- At least 12-18 links to show meaningful branching and merging

JSON format:
{
  "nodes": [
    {"id": "n1", "name": "Website Visitors"},
    {"id": "n2", "name": "Landing Page"},
    {"id": "n3", "name": "Product Page"},
    {"id": "n4", "name": "Add to Cart"},
    {"id": "n5", "name": "Purchase"}
  ],
  "links": [
    {"source": "n1", "target": "n2", "value": 1000},
    {"source": "n2", "target": "n3", "value": 650},
    {"source": "n3", "target": "n4", "value": 380},
    {"source": "n4", "target": "n5", "value": 210}
  ]
}`;

  return await callOpenAI<SankeyDiagramData>(systemPrompt, userInput, MODELS.COMPLEX);
}

async function generateSwimlaneDiagram(userInput: string): Promise<AIResult<SwimlaneDiagramData>> {
  const systemPrompt = `Create a detailed swimlane diagram for cross-functional processes with rich task descriptions.

CRITICAL RULES:
- lanes: array of 3-5 {id, name} representing roles/departments/teams involved in the process
- tasks: array of {id, lane, content, description, position}
- For each task:
  * content: concise task name (2-5 words)
  * description: 2-3 sentence explanation of what this task involves, what inputs it requires, what actions are performed, and what output or handoff it produces
  * position: 0-indexed sequential step number (use the same position for tasks that happen in parallel across different lanes)
- Create 10-18 realistic tasks distributed across all lanes
- Use the same position value for concurrent tasks in different lanes

JSON format:
{
  "lanes": [
    {"id": "dev", "name": "Developer"},
    {"id": "qa", "name": "QA Engineer"},
    {"id": "pm", "name": "Product Manager"}
  ],
  "tasks": [
    {
      "id": "t1",
      "lane": "pm",
      "content": "Define Requirements",
      "description": "Product Manager gathers stakeholder input and documents functional requirements. This produces a requirements document that serves as the single source of truth for the development team.",
      "position": 0
    },
    {
      "id": "t2",
      "lane": "dev",
      "content": "Write Unit Tests",
      "description": "Developer writes comprehensive unit tests covering happy paths and critical edge cases. These tests define expected behavior and serve as regression safeguards throughout the development cycle.",
      "position": 1
    }
  ]
}`;

  return await callOpenAI<SwimlaneDiagramData>(systemPrompt, userInput, MODELS.COMPLEX);
}

// ============================================================================
// CATEGORY 4: NUMERICAL DATA
// ============================================================================

async function generateLineChart(userInput: string): Promise<AIResult<LineChartData>> {
  const systemPrompt = `Create rich line chart data with meaningful time-series or progression data.

CRITICAL RULES:
- data: 12-24 data points representing a meaningful time range or progression sequence
- Include 2-4 meaningful metrics as separate lines — each line should tell a coherent story
- Use realistic, contextually accurate values with natural variation (trends, seasonality, dips)
- name: clear time/progression labels (e.g., "Jan 2023", "Q1", "Week 1", "Day 1", "v1.0")
- Values must be in realistic ranges for the topic — no placeholder numbers
- Metrics should relate to each other meaningfully (e.g., revenue vs expenses vs profit)

JSON format:
{
  "data": [
    {"name": "Jan 2023", "revenue": 42500, "expenses": 31200, "profit": 11300},
    {"name": "Feb 2023", "revenue": 38900, "expenses": 29800, "profit": 9100},
    {"name": "Mar 2023", "revenue": 51200, "expenses": 33400, "profit": 17800}
  ],
  "lines": ["revenue", "expenses", "profit"]
}`;

  return await callOpenAI<LineChartData>(systemPrompt, userInput, MODELS.SIMPLE);
}

async function generateBarChart(userInput: string): Promise<AIResult<BarChartData>> {
  const systemPrompt = `Create detailed bar chart data with meaningful categorical comparisons.

CRITICAL RULES:
- data: 8-16 categories with realistic, contextually accurate values
- Include 2-4 metrics per category for rich comparison — make it visually interesting
- Values must reflect real-world proportions and magnitudes for the topic
- Categories should cover the full meaningful scope (no redundant or filler entries)
- Use descriptive, specific category names — not generic "Product A", "Category 1"
- Metrics should have meaningful names that describe what they measure

JSON format:
{
  "data": [
    {"name": "North America", "revenue": 84200, "growth": 12400, "users": 42000},
    {"name": "Europe", "revenue": 61500, "growth": 8900, "users": 31200},
    {"name": "Asia Pacific", "revenue": 52800, "growth": 15600, "users": 28500}
  ],
  "bars": ["revenue", "growth", "users"]
}`;

  return await callOpenAI<BarChartData>(systemPrompt, userInput, MODELS.SIMPLE);
}

async function generateScatterPlot(userInput: string): Promise<AIResult<ScatterPlotData>> {
  const systemPrompt = `Create scatter plot data showing meaningful correlations and distributions.

CRITICAL RULES:
- data: 30-50 data points with realistic spread across the value range
- x, y values must show a meaningful correlation or pattern relevant to the topic (positive, negative, or clustered)
- z (optional): bubble size for a meaningful 3rd dimension (e.g., market cap, revenue, sample size)
- name: descriptive, specific identifier for each data point (not "Point 1")
- category: 3-5 distinct groups for color-coding — distribute points meaningfully across groups
- Values must reflect real-world data ranges typical for the topic
- Include outliers, clusters, and variance to make the chart informative

JSON format:
{
  "data": [
    {"x": 45, "y": 78, "z": 12, "name": "Company Alpha", "category": "Tech"},
    {"x": 62, "y": 85, "z": 28, "name": "Company Beta", "category": "Healthcare"},
    {"x": 31, "y": 55, "z": 8, "name": "Company Gamma", "category": "Finance"}
  ]
}`;

  return await callOpenAI<ScatterPlotData>(systemPrompt, userInput, MODELS.SIMPLE);
}

async function generateHeatmap(userInput: string): Promise<AIResult<HeatmapData>> {
  const systemPrompt = `Create a comprehensive heatmap with complete grid coverage for pattern visualization.

CRITICAL RULES:
- data: Generate a COMPLETE grid — EVERY x/y combination must have a value (no missing cells)
- x-axis: 7-12 categories (e.g., days of week, months, departments, features)
- y-axis: 5-8 categories (e.g., hours, weeks, teams, metrics)
- value: 0-100 intensity with realistic, meaningful patterns (peaks, valleys, clusters, gradients)
- Pattern must tell a story (e.g., higher activity at rush hours, seasonal peaks, hotspots)
- Total cells = x-count × y-count — generate ALL of them
- Values should vary naturally across the grid, not random noise

JSON format:
{
  "data": [
    {"x": "Mon", "y": "9AM", "value": 72},
    {"x": "Mon", "y": "10AM", "value": 88},
    {"x": "Mon", "y": "11AM", "value": 65},
    {"x": "Tue", "y": "9AM", "value": 58},
    {"x": "Tue", "y": "10AM", "value": 91},
    {"x": "Tue", "y": "11AM", "value": 77}
  ]
}`;

  return await callOpenAI<HeatmapData>(systemPrompt, userInput, MODELS.SIMPLE);
}

async function generateRadarChart(userInput: string): Promise<AIResult<RadarChartData>> {
  const systemPrompt = `Create multi-dimensional radar chart data for comparing entities across meaningful metrics.

CRITICAL RULES:
- data: 6-10 subjects (dimensions/metrics) — cover the most meaningful aspects of the topic
- Include 2-4 distinct entities to compare (e.g., competitors, products, time periods, options)
- All values on a consistent 0-100 scale for fair visual comparison
- Entities should show meaningful differences across dimensions — avoid uniform scores
- Subject names should be concise but specific (2-4 words)
- Metric keys must be snake_case or camelCase matching exactly across all data rows

JSON format:
{
  "data": [
    {"subject": "Performance", "option_a": 88, "option_b": 72, "option_c": 94},
    {"subject": "Cost Efficiency", "option_a": 65, "option_b": 91, "option_c": 52},
    {"subject": "Scalability", "option_a": 92, "option_b": 78, "option_c": 85},
    {"subject": "Ease of Use", "option_a": 74, "option_b": 96, "option_c": 61},
    {"subject": "Community Support", "option_a": 95, "option_b": 82, "option_c": 70},
    {"subject": "Security", "option_a": 89, "option_b": 75, "option_c": 93}
  ],
  "metrics": ["option_a", "option_b", "option_c"]
}`;

  return await callOpenAI<RadarChartData>(systemPrompt, userInput, MODELS.SIMPLE);
}

async function generatePieChart(userInput: string): Promise<AIResult<PieChartData>> {
  const systemPrompt = `Create pie chart data with a meaningful, detailed proportional breakdown.

CRITICAL RULES:
- data: 5-8 segments that together cover the complete picture (no important category omitted)
- Values should be realistic — use actual percentages or counts typical for the topic
- Use varied proportions — avoid uniform slices; some segments should dominate, others be smaller
- Segment names must be specific and descriptive, not generic ("Category A")
- Assign hex colors from this palette: #8b5cf6, #06b6d4, #10b981, #f59e0b, #ec4899, #f97316, #6366f1, #14b8a6
- If using percentages, values should sum to approximately 100

JSON format:
{
  "data": [
    {"name": "Direct Search", "value": 34, "color": "#8b5cf6"},
    {"name": "Organic SEO", "value": 27, "color": "#06b6d4"},
    {"name": "Social Media", "value": 18, "color": "#10b981"},
    {"name": "Paid Ads", "value": 12, "color": "#f59e0b"},
    {"name": "Referral", "value": 9, "color": "#ec4899"}
  ]
}`;

  return await callOpenAI<PieChartData>(systemPrompt, userInput, MODELS.SIMPLE);
}

// ============================================================================
// CATEGORY 5: COMPARISONS
// ============================================================================

async function generateComparisonTable(userInput: string): Promise<AIResult<ComparisonTableData>> {
  const systemPrompt = `Create a comprehensive comparison table with rich feature rows and meaningful, accurate values.

CRITICAL RULES:
- columns: First column is always the feature/attribute label, then 3-5 entities/options to compare
- data: 12-20 rows covering ALL meaningful dimensions: pricing, features, limits, performance, support, use cases
- Use VARIED value types for richness:
  * true/false for boolean yes/no capabilities
  * Strings for labels, tiers, or descriptions (e.g., "Enterprise", "Limited", "24/7")
  * Numbers with units for specs (e.g., "10 GB", "$49/mo", "99.9%")
- Values must accurately reflect real differences between the options — not arbitrary
- Cover both quantitative specs AND qualitative differentiators
- Column headers should be specific names, not "Option A"

JSON format:
{
  "columns": [
    {"id": "feature", "header": "Feature", "accessorKey": "feature"},
    {"id": "basic", "header": "Basic Plan", "accessorKey": "basic"},
    {"id": "pro", "header": "Pro Plan", "accessorKey": "pro"},
    {"id": "enterprise", "header": "Enterprise", "accessorKey": "enterprise"}
  ],
  "data": [
    {"feature": "Monthly Price", "basic": "$9/mo", "pro": "$29/mo", "enterprise": "Custom"},
    {"feature": "Storage", "basic": "5 GB", "pro": "50 GB", "enterprise": "Unlimited"},
    {"feature": "API Access", "basic": false, "pro": true, "enterprise": true},
    {"feature": "Custom Domain", "basic": false, "pro": true, "enterprise": true},
    {"feature": "Priority Support", "basic": false, "pro": false, "enterprise": true},
    {"feature": "SLA Uptime", "basic": "99%", "pro": "99.9%", "enterprise": "99.99%"}
  ]
}`;

  return await callOpenAI<ComparisonTableData>(systemPrompt, userInput, MODELS.COMPLEX);
}

async function generateParallelCoordinates(userInput: string): Promise<AIResult<ParallelCoordinatesData>> {
  const systemPrompt = `Create parallel coordinates data for rich multi-dimensional item comparison.

CRITICAL RULES:
- data: 20-35 data points representing distinct items/entities to compare across dimensions
- dimensions: 5-7 meaningful numeric dimensions with descriptive names (snake_case)
- All values 0-100 (normalized scale) for fair visual comparison across axes
- Data points should show variety: high-performers, low-performers, specialized profiles, balanced items
- Dimension names must match exactly as keys in every data object
- Items should represent real entities relevant to the topic (not "Item 1")
- Include interesting patterns: some items strong in some dimensions, weak in others

JSON format:
{
  "data": [
    {"performance": 92, "cost_efficiency": 58, "reliability": 88, "scalability": 95, "ease_of_use": 72, "support_quality": 85},
    {"performance": 71, "cost_efficiency": 94, "reliability": 76, "scalability": 60, "ease_of_use": 96, "support_quality": 68},
    {"performance": 85, "cost_efficiency": 79, "reliability": 91, "scalability": 82, "ease_of_use": 77, "support_quality": 90}
  ],
  "dimensions": ["performance", "cost_efficiency", "reliability", "scalability", "ease_of_use", "support_quality"]
}`;

  return await callOpenAI<ParallelCoordinatesData>(systemPrompt, userInput, MODELS.SIMPLE);
}

// ============================================================================
// CATEGORY 6: TEXT & CONTENT
// ============================================================================

async function generateWordCloud(userInput: string): Promise<AIResult<WordCloudData>> {
  const systemPrompt = `Create a rich word cloud with meaningful terms and natural frequency distribution.

CRITICAL RULES:
- words: 45-65 terms that comprehensively cover the topic from multiple angles
- Include a natural power-law frequency distribution:
  * 3-5 dominant terms (value 75-100) — core concepts
  * 10-15 important terms (value 40-72) — secondary themes
  * 25-45 supporting terms (value 10-38) — specific details, subtopics, related concepts
- Terms should be meaningful single words or concise 2-word phrases (no articles, prepositions)
- Cover different aspects: concepts, tools, techniques, people, events, outcomes — whatever fits the topic
- No duplicate or near-duplicate terms

JSON format:
{
  "words": [
    {"text": "machine learning", "value": 98},
    {"text": "neural network", "value": 86},
    {"text": "deep learning", "value": 82},
    {"text": "training data", "value": 68},
    {"text": "algorithm", "value": 61},
    {"text": "gradient descent", "value": 54},
    {"text": "overfitting", "value": 38},
    {"text": "backpropagation", "value": 35},
    {"text": "classification", "value": 29}
  ]
}`;

  // Using d3-cloud (industry standard, actively maintained)
  // Component will use d3-cloud for layout + custom React rendering
  return await callOpenAI<WordCloudData>(systemPrompt, userInput, MODELS.SIMPLE);
}

async function generateSyntaxDiagram(userInput: string): Promise<AIResult<SyntaxDiagramData>> {
  const systemPrompt = `Create a comprehensive syntax diagram with complete, well-structured grammar rules.

CRITICAL RULES:
- syntax: Clear, specific description of the language/grammar/format being represented
- rules: 8-14 grammar rules that fully define the syntax structure
- Each rule name should be a meaningful identifier (snake_case)
- Each pattern should use EBNF-style notation:
  * '...' for literal terminals
  * UPPERCASE for token types (STRING, NUMBER, IDENTIFIER)
  * [...] for optional elements
  * (...) for grouping
  * ... | ... for alternatives
  * ...* for zero or more, ...+ for one or more
- Rules should reference each other to show the complete grammar hierarchy
- Start with the top-level rule and work down to terminals
- Cover: the main construct, its sub-parts, expressions, literals, identifiers, operators

JSON format:
{
  "syntax": "SQL SELECT Statement",
  "rules": [
    {"name": "select_stmt", "pattern": "'SELECT' [DISTINCT] column_list 'FROM' table_ref [join_clause] [where_clause] [group_by] [having_clause] [order_by] [limit_clause]"},
    {"name": "column_list", "pattern": "'*' | column_expr (',' column_expr)*"},
    {"name": "column_expr", "pattern": "expression ['AS' IDENTIFIER]"},
    {"name": "table_ref", "pattern": "IDENTIFIER ['AS' IDENTIFIER] | '(' select_stmt ')' 'AS' IDENTIFIER"},
    {"name": "join_clause", "pattern": "(INNER | LEFT | RIGHT | FULL) 'JOIN' table_ref 'ON' condition"},
    {"name": "where_clause", "pattern": "'WHERE' condition"},
    {"name": "condition", "pattern": "expression comparison_op expression | condition ('AND' | 'OR') condition"},
    {"name": "expression", "pattern": "IDENTIFIER | literal | function_call | '(' expression ')'"},
    {"name": "function_call", "pattern": "IDENTIFIER '(' [expression (',' expression)*] ')'"},
    {"name": "literal", "pattern": "NUMBER | STRING | 'NULL' | 'TRUE' | 'FALSE'"},
    {"name": "comparison_op", "pattern": "'=' | '!=' | '<' | '>' | '<=' | '>=' | 'LIKE' | 'IN' | 'IS'"}
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
      max_completion_tokens: 16384, // hard cap — prevents runaway output costs
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
      flowchart: `${basePrompt}

For flowcharts:
- Each node has: id, type ('start'|'end'|'process'|'decision'|'input'|'output'), data: { label, color? }, position.
- To change a node's color, set data.color to a hex code (e.g. "#ef4444" for red, "#3b82f6" for blue).
- To reset a node to its default color, remove the data.color field or set it to null.
- To change all nodes to a color, set data.color on every node in the array.
- Edges have: id, source, target, label (optional).`,
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
