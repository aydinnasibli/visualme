"use client";

import dynamic from "next/dynamic";
import { VisualizationType } from "@/lib/types/visualization";
import { ComponentType } from "react";

// Lazy load all visualization components
const NetworkGraph = dynamic(() => import("./NetworkGraph"), { ssr: false });
const MindMap = dynamic(() => import("./MindMap"), { ssr: false });
const TreeDiagram = dynamic(() => import("./TreeDiagram"), { ssr: false });
const Timeline = dynamic(() => import("./Timeline"), { ssr: false });

// Phase 1: Charts
const LineChart = dynamic(() => import("./LineChart"), { ssr: false });
const BarChart = dynamic(() => import("./BarChart"), { ssr: false });
const PieChart = dynamic(() => import("./PieChart"), { ssr: false });
const ScatterPlot = dynamic(() => import("./ScatterPlot"), { ssr: false });
const RadarChart = dynamic(() => import("./RadarChart"), { ssr: false });

// Phase 2: Time & Sequence
const GanttChart = dynamic(() => import("./GanttChart"), { ssr: false });
const AnimatedTimeline = dynamic(() => import("./AnimatedTimeline"), { ssr: false });

// Phase 3: Processes & Flows
const Flowchart = dynamic(() => import("./Flowchart"), { ssr: false });
const SwimlaneDiagram = dynamic(() => import("./SwimlaneDiagram"), { ssr: false });
const SankeyDiagram = dynamic(() => import("./SankeyDiagram"), { ssr: false });

// Phase 4: Text & Comparison
const WordCloud = dynamic(() => import("./WordCloud"), { ssr: false });
const SyntaxDiagram = dynamic(() => import("./SyntaxDiagram"), { ssr: false });
const ComparisonTable = dynamic(() => import("./ComparisonTable"), { ssr: false });
const ParallelCoordinates = dynamic(() => import("./ParallelCoordinates"), { ssr: false });
const Heatmap = dynamic(() => import("./Heatmap"), { ssr: false });

export const VISUALIZATION_COMPONENTS: Record<VisualizationType, ComponentType<any>> = {
  network_graph: NetworkGraph,
  mind_map: MindMap,
  tree_diagram: TreeDiagram,
  timeline: Timeline,

  // Phase 1
  line_chart: LineChart,
  bar_chart: BarChart,
  pie_chart: PieChart,
  scatter_plot: ScatterPlot,
  radar_chart: RadarChart,

  // Phase 2
  gantt_chart: GanttChart,
  animated_timeline: AnimatedTimeline,

  // Phase 3
  flowchart: Flowchart,
  swimlane_diagram: SwimlaneDiagram,
  sankey_diagram: SankeyDiagram,

  // Phase 4
  word_cloud: WordCloud,
  syntax_diagram: SyntaxDiagram,
  comparison_table: ComparisonTable,
  parallel_coordinates: ParallelCoordinates,
  heatmap: Heatmap,
};
