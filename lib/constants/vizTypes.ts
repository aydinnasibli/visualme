import type { LucideIcon } from 'lucide-react';
import {
  Network, Share2, Binary, GitFork, Calendar, CalendarRange,
  BarChart2, ScatterChart, LayoutGrid, Target, PieChart, Table2,
  SlidersHorizontal, Cloud, Code2, Play, Columns2, TrendingUp, Waves,
} from 'lucide-react';
import type { VisualizationType } from '@/lib/types/visualization';

export interface VizTypeConfig {
  id: VisualizationType;
  name: string;
  icon: LucideIcon;
  emoji: string;
  color: string;
  label: string;
}

export const VIZ_TYPE_CONFIG: VizTypeConfig[] = [
  { id: 'network_graph',        name: 'Network Graph',        icon: Network,           emoji: '🕸️', color: '#8b5cf6', label: 'Network Graph' },
  { id: 'mind_map',             name: 'Mind Map',             icon: Share2,            emoji: '🧠', color: '#a855f7', label: 'Mind Map' },
  { id: 'tree_diagram',         name: 'Tree Diagram',         icon: Binary,            emoji: '🌳', color: '#10b981', label: 'Tree Diagram' },
  { id: 'flowchart',            name: 'Flowchart',            icon: GitFork,           emoji: '🔀', color: '#14b8a6', label: 'Flowchart' },
  { id: 'timeline',             name: 'Timeline',             icon: Calendar,          emoji: '📅', color: '#06b6d4', label: 'Timeline' },
  { id: 'gantt_chart',          name: 'Gantt Chart',          icon: CalendarRange,     emoji: '📆', color: '#6366f1', label: 'Gantt Chart' },
  { id: 'animated_timeline',    name: 'Animated Timeline',    icon: Play,              emoji: '🎬', color: '#ec4899', label: 'Anim. Timeline' },
  { id: 'sankey_diagram',       name: 'Sankey Diagram',       icon: Waves,             emoji: '🌊', color: '#06b6d4', label: 'Sankey Diagram' },
  { id: 'swimlane_diagram',     name: 'Swimlane Diagram',     icon: Columns2,          emoji: '🏊', color: '#0ea5e9', label: 'Swimlane' },
  { id: 'line_chart',           name: 'Line Chart',           icon: TrendingUp,        emoji: '📈', color: '#10b981', label: 'Line Chart' },
  { id: 'bar_chart',            name: 'Bar Chart',            icon: BarChart2,         emoji: '📊', color: '#f59e0b', label: 'Bar Chart' },
  { id: 'scatter_plot',         name: 'Scatter Plot',         icon: ScatterChart,      emoji: '⚫', color: '#6366f1', label: 'Scatter Plot' },
  { id: 'heatmap',              name: 'Heatmap',              icon: LayoutGrid,        emoji: '🔥', color: '#ef4444', label: 'Heatmap' },
  { id: 'radar_chart',          name: 'Radar Chart',          icon: Target,            emoji: '🎯', color: '#8b5cf6', label: 'Radar Chart' },
  { id: 'pie_chart',            name: 'Pie Chart',            icon: PieChart,          emoji: '🥧', color: '#f97316', label: 'Pie Chart' },
  { id: 'comparison_table',     name: 'Comparison Table',     icon: Table2,            emoji: '📋', color: '#64748b', label: 'Comparison' },
  { id: 'parallel_coordinates', name: 'Parallel Coordinates', icon: SlidersHorizontal, emoji: '📏', color: '#a78bfa', label: 'Parallel Coords' },
  { id: 'word_cloud',           name: 'Word Cloud',           icon: Cloud,             emoji: '☁️', color: '#06b6d4', label: 'Word Cloud' },
  { id: 'syntax_diagram',       name: 'Syntax Diagram',       icon: Code2,             emoji: '🛤️', color: '#84cc16', label: 'Syntax Diagram' },
];

export const VIZ_TYPE_MAP = Object.fromEntries(
  VIZ_TYPE_CONFIG.map(t => [t.id, t])
) as Record<VisualizationType, VizTypeConfig>;
