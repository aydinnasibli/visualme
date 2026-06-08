'use client';

import { getUserVisualizations, deleteVisualization } from '@/lib/actions/visualize';
import Header from '@/components/dashboard/Header';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import type { SavedVisualization } from '@/lib/types/visualization';
import VisualizationModal from '@/components/visualizations/VisualizationModal';
import {
  Search, Grid, List, SearchX, Plus, Trash2, BarChart3,
} from 'lucide-react';

function VisualizationsContent() {
  const [visualizations, setVisualizations] = useState<SavedVisualization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViz, setSelectedViz] = useState<SavedVisualization | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

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

  const doDelete = async (id: string) => {
    try {
      const result = await deleteVisualization(id);
      if (result.success) {
        setVisualizations(prev => prev.filter(v => v._id !== id));
        toast.success('Deleted');
        if (selectedViz?._id === id) setSelectedViz(null);
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toast('Delete this visualization?', {
      action: { label: 'Delete', onClick: () => doDelete(id) },
      cancel: { label: 'Cancel', onClick: () => {} },
      duration: 5000,
    });
  };

  const handleVisualizationUpdate = (updatedViz: SavedVisualization) => {
    setVisualizations(prev => prev.map(v => v._id === updatedViz._id ? updatedViz : v));
    setSelectedViz(updatedViz);
  };

  const filtered = visualizations.filter(viz =>
    viz.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-6 pt-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink mb-2">My Visualizations</h1>
          <p className="text-ink-muted text-sm">Manage and revisit your generated diagrams</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg text-sm w-full md:w-64 bg-surface-2 border border-edge text-ink placeholder:text-ink-faint outline-none focus:border-accent/40 transition-colors"
            />
          </div>

          {/* View toggle */}
          <div className="flex p-1 rounded-lg bg-surface-2 border border-edge">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-accent/12 text-accent' : 'text-ink-faint hover:text-ink'}`}
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List view"
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-accent/12 text-accent' : 'text-ink-faint hover:text-ink'}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 rounded-xl animate-pulse surface-panel" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-surface-2 border border-edge">
            <SearchX size={36} className="text-ink-faint" />
          </div>
          <h3 className="text-xl font-semibold text-ink mb-2">No visualizations found</h3>
          <p className="text-ink-muted text-sm max-w-md mx-auto mb-6">
            {searchQuery
              ? 'Try adjusting your search.'
              : "You haven't created any visualizations yet."}
          </p>
          {!searchQuery && (
            <a href="/dashboard" className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 bg-accent text-surface-0 hover:bg-accent-hover">
              <Plus size={15} /> Create New
            </a>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-3'}>
          {filtered.map((viz) => (
            <div
              key={viz._id}
              onClick={() => setSelectedViz(viz)}
              className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all surface-panel hover:border-accent/30 ${
                viewMode === 'list' ? 'flex items-center p-4 gap-5' : 'flex flex-col'
              }`}
            >
              {/* Preview area */}
              <div className={`relative bg-surface-2 ${viewMode === 'list' ? 'w-28 h-18 rounded-lg shrink-0' : 'h-40 w-full'}`}>
                <div className="absolute inset-0 flex items-center justify-center text-ink-faint/40 group-hover:text-accent/40 transition-colors">
                  <BarChart3 size={44} strokeWidth={1.25} />
                </div>
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'p-4' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink group-hover:text-accent transition-colors line-clamp-1 text-[13.5px] mb-0.5">
                      {viz.title}
                    </h3>
                    <p className="text-[11px] text-ink-faint">
                      Edited {new Date(viz.updatedAt || viz.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {viewMode === 'list' && (
                    <button
                      onClick={(e) => handleDelete(e, viz._id!)}
                      className="p-2 rounded-lg shrink-0 transition-colors text-ink-faint hover:text-danger hover:bg-danger/10"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Grid mode delete button */}
              {viewMode === 'grid' && (
                <div className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDelete(e, viz._id!)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm transition-colors bg-surface-0/70 text-ink-muted hover:text-danger hover:bg-danger/15 border border-edge"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
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
    <div className="min-h-screen bg-surface-0 relative selection:bg-accent/20">
      <Header user={user || null} label="Library" />
      <VisualizationsContent />
    </div>
  );
}
