'use client';

import { getUserVisualizations, deleteVisualization } from '@/lib/actions/visualize';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import Header from '@/components/dashboard/Header';
import { useAuth } from '@clerk/nextjs';
import { Toaster, toast } from 'sonner';
import { useState, useEffect } from 'react';
import type { SavedVisualization } from '@/lib/types/visualization';
import VisualizationModal from '@/components/visualizations/VisualizationModal';
import { Search, Filter, Grid, List, SearchX, Plus, MoreVertical, Trash2, Network, Share2, Binary, Calendar, BarChart2, GitFork } from 'lucide-react';

// Separate component for content to allow async data fetching
function VisualizationsContent() {
  const [visualizations, setVisualizations] = useState<SavedVisualization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViz, setSelectedViz] = useState<SavedVisualization | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getUserVisualizations();
        if (response.success && response.data) {
          setVisualizations(response.data as SavedVisualization[]);
        } else {
          toast.error(response.error || 'Failed to load visualizations');
        }
      } catch (error) {
        console.error("Failed to load visualizations", error);
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
        if (selectedViz && selectedViz._id === id) {
          setSelectedViz(null);
        }
      } else {
        toast.error(result.error || 'Failed to delete visualization');
      }
    } catch (error) {
      console.error("Delete error", error);
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

  const getIconForType = (type: string) => {
    switch (type) {
      case 'network_graph': return Network;
      case 'mind_map': return Share2;
      case 'tree_diagram': return Binary;
      case 'timeline': return Calendar;
      case 'gantt_chart': return Calendar;
      case 'flowchart': return GitFork;
      case 'sankey_diagram': return GitFork;
      default: return BarChart2;
    }
  };

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
              <span className="capitalize">{filterType === 'all' ? 'All Types' : filterType.replace('_', ' ')}</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-dark border border-white/10 rounded-lg shadow-xl overflow-hidden z-20 hidden group-hover:block">
              {['all', 'network_graph', 'mind_map', 'tree_diagram', 'timeline', 'gantt_chart'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-white/5 hover:text-white capitalize"
                >
                  {type === 'all' ? 'All Types' : type.replace('_', ' ')}
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
            <div key={i} className="h-48 bg-surface-dark rounded-xl animate-pulse border border-white/5"></div>
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
          {(!searchQuery && filterType === 'all') && (
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
              {/* Preview Area (Simplified) */}
              <div className={`relative bg-surface-darker/50 ${viewMode === 'list' ? 'w-32 h-20 rounded-lg' : 'h-40 w-full'}`}>
                 <div className="absolute inset-0 flex items-center justify-center text-stone-600 group-hover:text-primary/50 transition-colors">
                    <Icon className="w-12 h-12 opacity-20" />
                 </div>
                 <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/50 backdrop-blur-sm text-[10px] text-stone-300 border border-white/10 capitalize">
                    {viz.type.replace('_', ' ')}
                 </div>
              </div>

              {/* Content */}
              <div className={`flex-1 ${viewMode === 'grid' ? 'p-5' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-stone-200 group-hover:text-primary transition-colors line-clamp-1 mb-1">
                      {viz.title}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Edited {new Date(viz.updatedAt || viz.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {viewMode === 'list' && (
                     <div className="flex items-center gap-2 ml-auto">
                          <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Additional actions logic
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg text-stone-400 hover:text-white transition-colors"
                          >
                             <MoreVertical className="w-5 h-5" />
                          </button>
                     </div>
                  )}
                </div>
              </div>

              {/* Grid Mode Actions Overlay */}
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

      {/* Visualization Modal */}
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
  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <Header user={null} /> {/* User will be handled by Clerk internally or passed if needed */}
      <VisualizationsContent />
    </div>
  );
}
