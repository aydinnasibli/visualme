'use client';

import { getUserVisualizations, deleteVisualization } from '@/lib/actions/visualize';
import Header from '@/components/dashboard/Header';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import type { SavedVisualization } from '@/lib/types/visualization';
import VisualizationModal from '@/components/visualizations/VisualizationModal';
import { VIZ_TYPE_MAP, VIZ_TYPE_CONFIG } from '@/lib/constants/vizTypes';
import {
  Search, Filter, Grid, List, SearchX, Plus, Trash2,
} from 'lucide-react';

function getLabelForType(type: string): string {
  return VIZ_TYPE_MAP[type as keyof typeof VIZ_TYPE_MAP]?.name ?? type.replace(/_/g, ' ');
}

function VisualizationsContent() {
  const [visualizations, setVisualizations] = useState<SavedVisualization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViz, setSelectedViz] = useState<SavedVisualization | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

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

  /* Click-outside to close filter dropdown */
  useEffect(() => {
    if (!filterOpen) return;
    const close = (e: MouseEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [filterOpen]);

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

  const filtered = visualizations.filter(viz => {
    const matchesSearch = viz.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || viz.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-6 pt-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Visualizations</h1>
          <p className="text-zinc-400">Manage and revisit your generated diagrams</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 w-full md:w-64"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          </div>

          {/* Filter — click-based dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(p => !p)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white hover:bg-slate-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>{filterType === 'all' ? 'All Types' : getLabelForType(filterType)}</span>
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 max-h-72 overflow-y-auto">
                <button
                  onClick={() => { setFilterType('all'); setFilterOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterType === 'all' ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}
                >
                  All Types
                </button>
                {VIZ_TYPE_CONFIG.map(type => (
                  <button
                    key={type.id}
                    onClick={() => { setFilterType(type.id); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterType === type.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex bg-slate-800 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-slate-800 rounded-xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <SearchX className="w-10 h-10 text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No visualizations found</h3>
          <p className="text-zinc-400 max-w-md mx-auto mb-6">
            {searchQuery || filterType !== 'all'
              ? "Try adjusting your search or filters."
              : "You haven't created any visualizations yet."}
          </p>
          {!searchQuery && filterType === 'all' && (
            <a href="/dashboard" className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create New
            </a>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
          {filtered.map((viz) => {
            const meta = VIZ_TYPE_MAP[viz.type as keyof typeof VIZ_TYPE_MAP];
            const Icon = meta?.icon;
            return (
              <div
                key={viz._id}
                onClick={() => setSelectedViz(viz)}
                className={`group relative bg-slate-800 border border-white/5 hover:border-indigo-500/50 rounded-xl overflow-hidden transition-all cursor-pointer ${
                  viewMode === 'list' ? 'flex items-center p-4 gap-6' : 'flex flex-col'
                }`}
              >
                {/* Preview area */}
                <div className={`relative bg-slate-900/50 ${viewMode === 'list' ? 'w-32 h-20 rounded-lg shrink-0' : 'h-40 w-full'}`}>
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-700 group-hover:text-indigo-500/50 transition-colors">
                    {Icon && <Icon className="w-12 h-12 opacity-20" />}
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/50 backdrop-blur-sm text-[10px] text-zinc-400 border border-white/10">
                    {getLabelForType(viz.type)}
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'p-5' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-zinc-200 group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
                        {viz.title}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Edited {new Date(viz.updatedAt || viz.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {viewMode === 'list' && (
                      <button
                        onClick={(e) => handleDelete(e, viz._id!)}
                        className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-zinc-500 transition-colors shrink-0"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid mode delete button */}
                {viewMode === 'grid' && (
                  <div className="absolute top-2 left-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
    <div className="min-h-screen bg-slate-900 relative selection:bg-indigo-500/20">
      <Header user={user || null} />
      <VisualizationsContent />
    </div>
  );
}
