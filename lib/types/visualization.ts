// ============================================================================
// VISUALIZATION TYPES - All 19 formats as per documentation
// ============================================================================

export type VisualizationType =
  // Category 1: Relationships & Networks (4 formats)
  | 'network_graph'
  | 'mind_map'
  | 'tree_diagram'
  | 'force_directed_graph'
  // Category 2: Time & Sequence (3 formats)
  | 'timeline'
  | 'gantt_chart'
  | 'animated_timeline'
  // Category 3: Processes & Flows (3 formats)
  | 'flowchart'
  | 'sankey_diagram'
  | 'swimlane_diagram'
  // Category 4: Numerical Data (5 formats)
  | 'line_chart'
  | 'bar_chart'
  | 'scatter_plot'
  | 'heatmap'
  | 'radar_chart'
  | 'pie_chart'
  // Category 5: Comparisons (2 formats)
  | 'comparison_table'
  | 'parallel_coordinates'
  // Category 6: Text & Content (2 formats)
  | 'word_cloud'
  | 'syntax_diagram';

export type VisualizationCategory =
  | 'relationships_networks'
  | 'time_sequence'
  | 'processes_flows'
  | 'numerical_data'
  | 'comparisons'
  | 'text_content';

// ============================================================================
// CATEGORY 1: RELATIONSHIPS & NETWORKS
// ============================================================================

export interface NetworkNode {
  id: string;
  label: string;
  description?: string;
  category?: string;
  color?: string;
  size?: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  weight?: number;
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface MindMapNode {
  content: string;
  children?: MindMapNode[];
}

export interface TreeNode {
  name: string;
  children?: TreeNode[];
  attributes?: Record<string, any>;
}

export interface TreeDiagramData {
  name: string;
  children?: TreeDiagramData[];
  value?: number;
}

export interface ForceGraphNode {
  id: string;
  name: string;
  group?: number;
  val?: number;
}

export interface ForceGraphLink {
  source: string;
  target: string;
  value?: number;
}

export interface ForceDirectedGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
}

// ============================================================================
// CATEGORY 2: TIME & SEQUENCE
// ============================================================================

export interface TimelineItem {
  id: string;
  content: string;
  start: Date | string;
  end?: Date | string;
  group?: string;
  className?: string;
  type?: 'point' | 'range' | 'box';
}

export interface TimelineData {
  items: TimelineItem[];
  groups?: Array<{ id: string; content: string }>;
}

export interface GanttTask {
  id: string;
  name: string;
  start: Date | string;
  end: Date | string;
  progress: number;
  dependencies?: string[];
  custom_class?: string;
}

export interface GanttChartData {
  tasks: GanttTask[];
}

export interface AnimatedTimelineStep {
  id: string;
  title: string;
  description: string;
  timestamp?: string;
  data?: any;
}

export interface AnimatedTimelineData {
  steps: AnimatedTimelineStep[];
}

// ============================================================================
// CATEGORY 3: PROCESSES & FLOWS
// ============================================================================

export type FlowchartNodeType = 'start' | 'end' | 'process' | 'decision' | 'input' | 'output';

export interface FlowchartNode {
  id: string;
  type: FlowchartNodeType;
  data: {
    label: string;
  };
  position: { x: number; y: number };
}

export interface FlowchartEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

export interface FlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export interface SankeyNode {
  id: string;
  name: string;
}

export interface SankeyLink {
  source: number | string;
  target: number | string;
  value: number;
}

export interface SankeyDiagramData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface SwimlaneLane {
  id: string;
  name: string;
}

export interface SwimlaneTask {
  id: string;
  lane: string;
  content: string;
  position: number;
}

export interface SwimlaneDiagramData {
  lanes: SwimlaneLane[];
  tasks: SwimlaneTask[];
}

// ============================================================================
// CATEGORY 4: NUMERICAL DATA
// ============================================================================

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface LineChartData {
  data: ChartDataPoint[];
  lines: string[];
}

export interface BarChartData {
  data: ChartDataPoint[];
  bars: string[];
}

export interface ScatterPlotPoint {
  x: number;
  y: number;
  z?: number;
  name?: string;
  category?: string;
}

export interface ScatterPlotData {
  data: ScatterPlotPoint[];
}

export interface HeatmapCell {
  x: string | number;
  y: string | number;
  value: number;
}

export interface HeatmapData {
  data: HeatmapCell[];
}

export interface RadarChartData {
  data: Array<{
    subject: string;
    [key: string]: any;
  }>;
  metrics: string[];
}

export interface PieChartData {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
}

// ============================================================================
// CATEGORY 5: COMPARISONS
// ============================================================================

export interface ComparisonTableData {
  columns: Array<{
    id: string;
    header: string;
    accessorKey: string;
  }>;
  data: Array<Record<string, any>>;
}

export interface ParallelCoordinatesData {
  data: Array<Record<string, number>>;
  dimensions: string[];
}

// ============================================================================
// CATEGORY 6: TEXT & CONTENT
// ============================================================================

export interface WordCloudWord {
  text: string;
  value: number;
}

export interface WordCloudData {
  words: WordCloudWord[];
}

export interface SyntaxDiagramData {
  syntax: string;
  rules: Array<{
    name: string;
    pattern: string;
  }>;
}

// ============================================================================
// UNIFIED VISUALIZATION DATA TYPE
// ============================================================================

export type VisualizationData =
  | NetworkGraphData
  | string // Mind map markdown
  | TreeDiagramData
  | ForceDirectedGraphData
  | TimelineData
  | GanttChartData
  | AnimatedTimelineData
  | FlowchartData
  | SankeyDiagramData
  | SwimlaneDiagramData
  | LineChartData
  | BarChartData
  | ScatterPlotData
  | HeatmapData
  | RadarChartData
  | PieChartData
  | ComparisonTableData
  | ParallelCoordinatesData
  | WordCloudData
  | SyntaxDiagramData;

// ============================================================================
// REQUEST & RESPONSE TYPES
// ============================================================================

export interface VisualizationRequest {
  input: string;
  type?: VisualizationType; // Optional: User can request specific type
  fileData?: FileData;
}

export interface FileData {
  filename: string;
  content: string;
  type: 'csv' | 'json' | 'txt' | 'pdf';
}

export interface VisualizationResponse {
  type: VisualizationType;
  data: VisualizationData;
  reason: string;
  success: boolean;
  error?: string;
  metadata?: VisualizationMetadata;
}

export interface VisualizationMetadata {
  generatedAt: Date;
  processingTime?: number;
  aiModel?: string;
  cost?: number;
  originalInput: string;
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface SavedVisualization {
  _id?: string;
  userId: string;
  title: string;
  type: VisualizationType;
  data: VisualizationData;
  metadata: VisualizationMetadata;
  isPublic: boolean;
  shareId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUsage {
  userId: string;
  visualizationsCreated: number;
  lastResetDate: Date;
  tier: 'free' | 'pro';
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json' | 'csv' | 'html';

export interface ExportRequest {
  visualizationId: string;
  format: ExportFormat;
  options?: ExportOptions;
}

export interface ExportOptions {
  resolution?: number; // For PNG (1x, 2x, 3x)
  includeMetadata?: boolean;
  title?: string;
}

export interface ShareLinkOptions {
  expiresIn?: number; // Days until expiration
  password?: string;
  isPublic: boolean;
}

// ============================================================================
// FORMAT METADATA
// ============================================================================

export interface FormatInfo {
  id: VisualizationType;
  name: string;
  description: string;
  category: VisualizationCategory;
  library: string;
  bestFor: string[];
  icon: string;
  estimatedCost: number;
}

export const FORMAT_INFO: Record<VisualizationType, FormatInfo> = {
  network_graph: {
    id: 'network_graph',
    name: 'Network Graph',
    description: 'Interactive node-based visualizations for concepts and relationships',
    category: 'relationships_networks',
    library: 'React Flow + Framer Motion',
    bestFor: ['concepts', 'org structures', 'dependencies', 'knowledge graphs'],
    icon: '🕸️',
    estimatedCost: 0.15,
  },
  mind_map: {
    id: 'mind_map',
    name: 'Mind Map',
    description: 'Hierarchical mind map visualizations',
    category: 'relationships_networks',
    library: 'Markmap',
    bestFor: ['brainstorming', 'note hierarchies', 'idea organization'],
    icon: '🧠',
    estimatedCost: 0.12,
  },
  tree_diagram: {
    id: 'tree_diagram',
    name: 'Tree Diagram',
    description: 'Hierarchical tree structures',
    category: 'relationships_networks',
    library: 'react-d3-tree',
    bestFor: ['hierarchies', 'JSON structures', 'file systems', 'org charts'],
    icon: '🌳',
    estimatedCost: 0.12,
  },
  force_directed_graph: {
    id: 'force_directed_graph',
    name: 'Force-Directed Graph',
    description: 'Physics-based network visualization',
    category: 'relationships_networks',
    library: 'react-force-graph',
    bestFor: ['complex networks', 'social graphs', 'clustered relationships'],
    icon: '⚡',
    estimatedCost: 0.18,
  },
  timeline: {
    id: 'timeline',
    name: 'Timeline',
    description: 'Interactive timeline visualization',
    category: 'time_sequence',
    library: 'Vis-Timeline',
    bestFor: ['historical events', 'project milestones', 'data over time'],
    icon: '📅',
    estimatedCost: 0.15,
  },
  gantt_chart: {
    id: 'gantt_chart',
    name: 'Gantt Chart',
    description: 'Project timeline with dependencies',
    category: 'time_sequence',
    library: 'Frappe Gantt',
    bestFor: ['project timelines', 'task dependencies', 'resource allocation'],
    icon: '📊',
    estimatedCost: 0.18,
  },
  animated_timeline: {
    id: 'animated_timeline',
    name: 'Animated Timeline',
    description: 'Step-by-step animated progression',
    category: 'time_sequence',
    library: 'Framer Motion',
    bestFor: ['step-by-step progressions', 'morphing data', 'evolution'],
    icon: '🎬',
    estimatedCost: 0.12,
  },
  flowchart: {
    id: 'flowchart',
    name: 'Flowchart',
    description: 'Process flow with decision points',
    category: 'processes_flows',
    library: 'ReactFlow / Mermaid.js',
    bestFor: ['workflows', 'algorithms', 'decision trees'],
    icon: '🔀',
    estimatedCost: 0.15,
  },
  sankey_diagram: {
    id: 'sankey_diagram',
    name: 'Sankey Diagram',
    description: 'Flow visualization with magnitudes',
    category: 'processes_flows',
    library: 'd3-sankey',
    bestFor: ['flow visualization', 'conversions', 'energy flow'],
    icon: '🌊',
    estimatedCost: 0.18,
  },
  swimlane_diagram: {
    id: 'swimlane_diagram',
    name: 'Swimlane Diagram',
    description: 'Cross-functional process flows',
    category: 'processes_flows',
    library: 'Mermaid.js',
    bestFor: ['cross-functional processes', 'responsibility mapping'],
    icon: '🏊',
    estimatedCost: 0.15,
  },
  line_chart: {
    id: 'line_chart',
    name: 'Line Chart',
    description: 'Trends over time or continuous data',
    category: 'numerical_data',
    library: 'Recharts',
    bestFor: ['trends', 'time-series data', 'comparisons'],
    icon: '📈',
    estimatedCost: 0.12,
  },
  bar_chart: {
    id: 'bar_chart',
    name: 'Bar Chart',
    description: 'Categorical comparisons',
    category: 'numerical_data',
    library: 'Recharts',
    bestFor: ['comparisons', 'categorical data', 'rankings'],
    icon: '📊',
    estimatedCost: 0.12,
  },
  scatter_plot: {
    id: 'scatter_plot',
    name: 'Scatter Plot',
    description: 'Correlations and distributions',
    category: 'numerical_data',
    library: 'Recharts',
    bestFor: ['correlations', 'distributions', 'multi-dimensional data'],
    icon: '⚫',
    estimatedCost: 0.12,
  },
  heatmap: {
    id: 'heatmap',
    name: 'Heatmap',
    description: 'Density and pattern visualization',
    category: 'numerical_data',
    library: 'Recharts',
    bestFor: ['density visualization', 'patterns', 'activity over time'],
    icon: '🔥',
    estimatedCost: 0.12,
  },
  radar_chart: {
    id: 'radar_chart',
    name: 'Radar Chart',
    description: 'Multi-dimensional comparisons',
    category: 'numerical_data',
    library: 'Recharts',
    bestFor: ['multi-dimensional comparisons', 'skill assessments'],
    icon: '🎯',
    estimatedCost: 0.12,
  },
  pie_chart: {
    id: 'pie_chart',
    name: 'Pie Chart',
    description: 'Proportions and percentages',
    category: 'numerical_data',
    library: 'Recharts',
    bestFor: ['proportions', 'percentages', 'market share'],
    icon: '🥧',
    estimatedCost: 0.10,
  },
  comparison_table: {
    id: 'comparison_table',
    name: 'Comparison Table',
    description: 'Side-by-side feature comparisons',
    category: 'comparisons',
    library: 'TanStack Table',
    bestFor: ['feature comparisons', 'product comparisons'],
    icon: '📋',
    estimatedCost: 0.10,
  },
  parallel_coordinates: {
    id: 'parallel_coordinates',
    name: 'Parallel Coordinates',
    description: 'Multi-dimensional data comparison',
    category: 'comparisons',
    library: 'd3-parcoords',
    bestFor: ['multi-dimensional data', 'complex comparisons'],
    icon: '📏',
    estimatedCost: 0.15,
  },
  word_cloud: {
    id: 'word_cloud',
    name: 'Word Cloud',
    description: 'Text frequency visualization',
    category: 'text_content',
    library: 'd3-cloud + D3.js',
    bestFor: ['text frequency', 'topic extraction', 'keyword visualization'],
    icon: '☁️',
    estimatedCost: 0.10,
  },
  syntax_diagram: {
    id: 'syntax_diagram',
    name: 'Syntax Diagram',
    description: 'Grammar and syntax visualization',
    category: 'text_content',
    library: 'railroad-diagrams',
    bestFor: ['grammar rules', 'parsing logic', 'API structures'],
    icon: '🛤️',
    estimatedCost: 0.12,
  },
};
