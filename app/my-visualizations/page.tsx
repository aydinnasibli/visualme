'use client';

import { getUserVisualizations, deleteVisualization } from '@/lib/actions/visualize';
import Header from '@/components/dashboard/Header';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import type { SavedVisualization } from '@/lib/types/visualization';
import VisualizationModal from '@/components/visualizations/VisualizationModal';
import {
  Search, Filter, Grid, List, SearchX, Plus, Trash2,
  Network, Share2, Binary, Calendar, BarChart2, GitFork,
  Play, Waves, Columns2, TrendingUp, ScatterChart, LayoutGrid,
  Target, PieChart, Table2, SlidersHorizontal, Cloud, Code2,
} from 'lucide-react';

const ALL_VIZ_TYPES = [
  { id: 'network_graph',        label: 'Network Graph' },
  { id: 'mind_map',             label: 'Mind Map' },
  { id: 'tree_diagram',         label: 'Tree Diagram' },
  { id: 'timeline',             label: 'Timeline' },
  { id: 'gantt_chart',          label: 'Gantt Chart' },
  { id: 'animated_timeline',    label: 'Animated Timeline' },
  { id: 'flowchart',            label: 'Flowchart' },
  { id: 'sankey_diagram',       label: 'Sankey Diagram' },
  { id: 'swimlane_diagram',     label: 'Swimlane' },
  { id: 'line_chart',           label: 'Line Chart' },
  { id: 'bar_chart',            label: 'Bar Chart' },
  { id: 'scatter_plot',         label: 'Scatter Plot' },
  { id: 'heatmap',              label: 'Heatmap' },
  { id: 'radar_chart',          label: 'Radar Chart' },
  { id: 'pie_chart',            label: 'Pie Chart' },
  { id: 'comparison_table',     label: 'Comparison Table' },
  { id: 'parallel_coordinates', label: 'Parallel Coordinates' },
  { id: 'word_cloud',           label: 'Word Cloud' },
  { id: 'syntax_diagram',       label: 'Syntax Diagram' },
];

function getIconForType(type: string) {
  switch (type) {
    case 'network_graph':        return Network;
    case 'mind_map':             return Share2;
    case 'tree_diagram':         return Binary;
    case 'timeline':             return Calendar;
    case 'gantt_chart':          return Calendar;
    case 'animated_timeline':    return Play;
    case 'flowchart':            return GitFork;
    case 'sankey_diagram':       return Waves;
    case 'swimlane_diagram':     return Columns2;
    case 'line_chart':           return TrendingUp;
    case 'bar_chart':            return BarChart2;
    case 'scatter_plot':         return ScatterChart;
    case 'heatmap':              return LayoutGrid;
    case 'radar_chart':          return Target;
    case 'pie_chart':            return PieChart;
    case 'comparison_table':     return Table2;
    case 'parallel_coordinates': return SlidersHorizontal;
    case 'word_cloud':           return Cloud;
    case 'syntax_diagram':       return Code2;
    default:                     return BarChart2;
  }
}

function getLabelForType(type: string): string {
  return ALL_VIZ_TYPES.find(t => t.id === type)?.label ?? type.replace(/_/g, ' ');
}

function VisualizationsContent() {
  const [visualizations, setVisualizations] = useState<SavedVisualization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViz, setSelectedViz] = useState<SavedVisualization | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getUserVisualizations();
        if (response.success && response.data) {
          setVisualizations(response.data as SavedVisualization[]);
        } else {
          toast.error(response.error || 'Failed to load visualizations');
        }
      } catch {
        toast.error('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this visualization?')) return;
    try {
      const result = await deleteVisualization(id);
      if (result.success) {
        setVisualizations(prev => prev.filter(v => v._id !== id));
        toast.success('Visualization deleted successfully');
        if (selectedViz && selectedViz._id === id) setSelectedViz(null);
      } else {
        toast.error(result.error || 'Failed to delete visualization');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  const handleVisualizationUpdate = (updatedViz: SavedVisualization) => {
    setVisualizations(prev => prev.map(v => v._id === updatedViz._id ? updatedViz : v));
    setSelectedViz(updatedViz);
  };

  const filteredVisualizations = visualizations.filter(viz => {
    const matchesSearch = viz.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || viz.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-6 pt-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Visualizations</h1>
          <p className="text-stone-400">Manage and revisit your generated diagrams</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-surface-dark border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 w-full md:w-64"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-surface-dark border border-white/10 rounded-lg text-sm text-white hover:bg-white/5 transition-colors">
              <Filter className="w-5 h-5" />
              <span>{filterType === 'all' ? 'All Types' : getLabelForType(filterType)}</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface-dark border border-white/10 rounded-lg shadow-xl overflow-hidden z-20 hidden group-hover:block max-h-72 overflow-y-auto">
              <button
                onClick={() => setFilterType('all')}
                className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-white/5 hover:text-white"
              >
                All Types
              </button>
              {ALL_VIZ_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-white/5 hover:text-white"
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex bg-surface-dark border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-stone-400 hover:text-white'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-stone-400 hover:text-white'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-surface-dark rounded-xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filteredVisualizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-dark flex items-center justify-center mb-4">
            <SearchX className="w-10 h-10 text-stone-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No visualizations found</h3>
          <p className="text-stone-400 max-w-md mx-auto mb-6">
            {searchQuery || filterType !== 'all'
              ? "Try adjusting your search or filters to find what you're looking for."
              : "You haven't created any visualizations yet. Start by generating your first diagram!"}
          </p>
          {!searchQuery && filterType === 'all' && (
            <a href="/dashboard" className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New
            </a>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
          {filteredVisualizations.map((viz) => {
            const Icon = getIconForType(viz.type);
            return (
              <div
                key={viz._id}
                onClick={() => setSelectedViz(viz)}
                className={`group relative bg-surface-dark border border-white/5 hover:border-primary/50 rounded-xl overflow-hidden transition-all cursor-pointer ${
                  viewMode === 'list' ? 'flex items-center p-4 gap-6' : 'flex flex-col'
                }`}
              >
                {/* Preview area */}
                <div className={`relative bg-surface-darker/50 ${viewMode === 'list' ? 'w-32 h-20 rounded-lg shrink-0' : 'h-40 w-full'}`}>
                  <div className="absolute inset-0 flex items-center justify-center text-stone-600 group-hover:text-primary/50 transition-colors">
                    <Icon className="w-12 h-12 opacity-20" />
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/50 backdrop-blur-sm text-[10px] text-stone-300 border border-white/10">
                    {getLabelForType(viz.type)}
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'p-5' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-stone-200 group-hover:text-primary transition-colors line-clamp-1 mb-1">
                        {viz.title}
                      </h3>
                      <p className="text-xs text-stone-500">
                        Edited {new Date(viz.updatedAt || viz.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {viewMode === 'list' && (
                      <button
                        onClick={(e) => handleDelete(e, viz._id!)}
                        className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-stone-500 transition-colors shrink-0"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid mode delete overlay */}
                {viewMode === 'grid' && (
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDelete(e, viz._id!)}
                      className="p-2 bg-black/60 hover:bg-red-500/80 backdrop-blur-sm rounded-lg text-white/70 hover:text-white transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedViz && (
        <VisualizationModal
          visualization={selectedViz}
          onClose={() => setSelectedViz(null)}
          onVisualizationUpdated={handleVisualizationUpdate}
        />
      )}
    </div>
  );
}

export default function MyVisualizationsPage() {
  const { user } = useUser();
  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <Header user={user || null} />
      <VisualizationsContent />
    </div>
  );
}
