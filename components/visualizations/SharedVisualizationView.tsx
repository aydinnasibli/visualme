'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { SavedVisualization } from '@/lib/types/visualization';

const Loader = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
  </div>
);
const dyn = (fn: () => Promise<{ default: React.ComponentType<any> }>) =>
  dynamic(fn, { ssr: false, loading: Loader });

const DynNetworkGraph      = dyn(() => import('./NetworkGraph'));
const DynMindMap           = dyn(() => import('./MindMap'));
const DynTreeDiagram       = dyn(() => import('./TreeDiagram'));
const DynTimeline          = dyn(() => import('./Timeline'));
const DynGanttChart        = dyn(() => import('./GanttChart'));
const DynAnimatedTimeline  = dyn(() => import('./AnimatedTimeline'));
const DynFlowchart         = dyn(() => import('./Flowchart'));
const DynSankeyDiagram     = dyn(() => import('./SankeyDiagram'));
const DynSwimlaneDiagram   = dyn(() => import('./SwimlaneDiagram'));
const DynLineChart         = dyn(() => import('./LineChart'));
const DynBarChart          = dyn(() => import('./BarChart'));
const DynScatterPlot       = dyn(() => import('./ScatterPlot'));
const DynHeatmap           = dyn(() => import('./Heatmap'));
const DynRadarChart        = dyn(() => import('./RadarChart'));
const DynPieChart          = dyn(() => import('./PieChart'));
const DynComparisonTable   = dyn(() => import('./ComparisonTable'));
const DynParallelCoords    = dyn(() => import('./ParallelCoordinates'));
const DynWordCloud         = dyn(() => import('./WordCloud'));
const DynSyntaxDiagram     = dyn(() => import('./SyntaxDiagram'));

const TYPE_LABELS: Record<string, string> = {
  network_graph: 'Network Graph', mind_map: 'Mind Map', tree_diagram: 'Tree Diagram',
  timeline: 'Timeline', gantt_chart: 'Gantt Chart', animated_timeline: 'Animated Timeline',
  flowchart: 'Flowchart', sankey_diagram: 'Sankey Diagram', swimlane_diagram: 'Swimlane',
  line_chart: 'Line Chart', bar_chart: 'Bar Chart', scatter_plot: 'Scatter Plot',
  heatmap: 'Heatmap', radar_chart: 'Radar Chart', pie_chart: 'Pie Chart',
  comparison_table: 'Comparison Table', parallel_coordinates: 'Parallel Coordinates',
  word_cloud: 'Word Cloud', syntax_diagram: 'Syntax Diagram',
};

function renderViz(viz: SavedVisualization) {
  const d = viz.data as any;
  switch (viz.type) {
    case 'network_graph':        return <DynNetworkGraph data={d} readOnly />;
    case 'mind_map':             return <DynMindMap data={d} readOnly />;
    case 'tree_diagram':         return <DynTreeDiagram data={d} readOnly />;
    case 'timeline':             return <DynTimeline data={d} readOnly />;
    case 'gantt_chart':          return <DynGanttChart data={d} />;
    case 'animated_timeline':    return <DynAnimatedTimeline data={d} />;
    case 'flowchart':            return <DynFlowchart data={d} />;
    case 'sankey_diagram':       return <DynSankeyDiagram data={d} />;
    case 'swimlane_diagram':     return <DynSwimlaneDiagram data={d} />;
    case 'line_chart':           return <DynLineChart data={d} />;
    case 'bar_chart':            return <DynBarChart data={d} />;
    case 'scatter_plot':         return <DynScatterPlot data={d} />;
    case 'heatmap':              return <DynHeatmap data={d} />;
    case 'radar_chart':          return <DynRadarChart data={d} />;
    case 'pie_chart':            return <DynPieChart data={d} />;
    case 'comparison_table':     return <DynComparisonTable data={d} />;
    case 'parallel_coordinates': return <DynParallelCoords data={d} />;
    case 'word_cloud':           return <DynWordCloud data={d} />;
    case 'syntax_diagram':       return <DynSyntaxDiagram data={d} />;
    default:                     return <div className="flex items-center justify-center h-full text-zinc-500 text-sm">Unknown visualization type</div>;
  }
}

export default function SharedVisualizationView({ visualization }: { visualization: SavedVisualization }) {
  const typeLabel = TYPE_LABELS[visualization.type] ?? visualization.type.replace(/_/g, ' ');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0d11' }}>
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/5" style={{ background: '#0f1419' }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="w-7 h-7 rounded-lg bg-surface-dark border border-white/10 flex items-center justify-center text-primary font-bold text-sm">V</Link>
          <span className="text-stone-400 text-sm">VisualMe</span>
          <span className="text-stone-700">/</span>
          <span className="text-stone-300 text-sm font-medium truncate max-w-xs">{visualization.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-stone-400 border border-white/5">{typeLabel}</span>
          <Link
            href="/sign-up"
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            Try VisualMe free
          </Link>
        </div>
      </header>

      {/* Viz */}
      <div className="flex-1 relative">
        {renderViz(visualization)}
      </div>

      {/* Footer */}
      <footer className="h-10 flex items-center justify-center border-t border-white/5 text-xs text-stone-600">
        Shared via{' '}
        <Link href="/" className="text-stone-500 hover:text-stone-300 transition-colors ml-1">VisualMe</Link>
      </footer>
    </div>
  );
}
