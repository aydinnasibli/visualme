'use client';

import { useState, useMemo, useEffect } from 'react';
import { getUserVisualizations, deleteVisualization } from '@/lib/actions/profile';
import type { SavedVisualization } from '@/lib/types/visualization';
import { FORMAT_INFO } from '@/lib/types/visualization';

export default function MyVisualizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visualizations, setVisualizations] = useState<SavedVisualization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadVisualizations();
  }, []);

  const loadVisualizations = async () => {
    try {
      setLoading(true);
      const result = await getUserVisualizations();
      if (result.success && result.data) {
        setVisualizations(result.data);
      } else {
        setError(result.error || 'Failed to load visualizations');
      }
    } catch (err) {
      setError('An error occurred while loading visualizations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vizId: string) => {
    try {
      setDeleting(true);
      const result = await deleteVisualization(vizId);
      if (result.success) {
        // Remove from local state
        setVisualizations(prev => prev.filter(v => v._id !== vizId));
        setDeleteConfirmId(null);
        setActiveMenuId(null);
      } else {
        setError(result.error || 'Failed to delete visualization');
      }
    } catch (err) {
      setError('An error occurred while deleting');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuId(null);
      setShowTypeDropdown(false);
      setShowDateDropdown(false);
    };

    if (activeMenuId || showTypeDropdown || showDateDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenuId, showTypeDropdown, showDateDropdown]);

  const badgeColors: Record<string, string> = {
    network_graph: 'bg-blue-100 text-blue-800 dark:bg-primary/20 dark:text-blue-200',
    mind_map: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200',
    tree_diagram: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200',
    force_directed_graph: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200',
    timeline: 'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-200',
    gantt_chart: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200',
    flowchart: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200',
    sankey_diagram: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200',
    line_chart: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200',
    bar_chart: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200',
    pie_chart: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200',
    heatmap: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200',
    word_cloud: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200',
  };

  // Get unique visualization types for filter dropdown
  const vizTypes = useMemo(() => {
    return Array.from(new Set(visualizations.map(v => v.type)));
  }, [visualizations]);

  // Filter visualizations based on search query and filters
  const filteredVisualizations = useMemo(() => {
    return visualizations.filter(viz => {
      // Search filter
      if (searchQuery && !viz.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && viz.type !== typeFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        const vizDate = new Date(viz.createdAt);

        if (dateFilter === 'today') {
          const isToday = vizDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (vizDate < weekAgo) return false;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (vizDate < monthAgo) return false;
        } else if (dateFilter === 'year') {
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          if (vizDate < yearAgo) return false;
        }
      }

      return true;
    });
  }, [visualizations, searchQuery, typeFilter, dateFilter]);

  const getRelativeTime = (date: string | Date) => {
    const now = new Date();
    const vizDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - vizDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return vizDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0f1419]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header & Stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">My Visualizations</h1>
            <p className="text-gray-400 text-base sm:text-lg">Manage, organize, and track your creative data output.</p>
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none lg:min-w-[160px] flex flex-col gap-1 rounded-xl p-4 bg-[#1a1f28] border border-[#282e39] shadow-sm">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                <p className="text-xs font-bold uppercase tracking-wide">Total</p>
              </div>
              <p className="text-2xl font-bold text-white">{filteredVisualizations.length}</p>
            </div>
            <div className="flex-1 lg:flex-none lg:min-w-[160px] flex flex-col gap-1 rounded-xl p-4 bg-[#1a1f28] border border-[#282e39] shadow-sm">
              <div className="flex items-center gap-2 text-purple-500">
                <span className="material-symbols-outlined text-[20px]">cloud</span>
                <p className="text-xs font-bold uppercase tracking-wide">All Time</p>
              </div>
              <p className="text-2xl font-bold text-white">{visualizations.length}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full sm:max-w-xs group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">search</span>
              <input
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#1a1f28] border border-[#282e39] text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all outline-none text-sm"
                placeholder="Search your library..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="hidden sm:block w-px h-8 bg-[#282e39] mx-2"></div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              {/* Type Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTypeDropdown(!showTypeDropdown);
                    setShowDateDropdown(false);
                  }}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#1a1f28] hover:bg-[#282e39] border border-[#282e39] text-gray-300 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <span>{typeFilter === 'all' ? 'Type' : FORMAT_INFO[typeFilter as keyof typeof FORMAT_INFO]?.name || typeFilter}</span>
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
                {showTypeDropdown && (
                  <div className="absolute top-full mt-2 left-0 w-48 bg-[#1a1f28] border border-[#282e39] rounded-lg shadow-lg z-50 py-2 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setTypeFilter('all');
                        setShowTypeDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#282e39] transition-colors ${
                        typeFilter === 'all' ? 'text-primary font-medium' : 'text-gray-300'
                      }`}
                    >
                      All Types
                    </button>
                    {vizTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setTypeFilter(type);
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[#282e39] transition-colors ${
                          typeFilter === type ? 'text-primary font-medium' : 'text-gray-300'
                        }`}
                      >
                        {FORMAT_INFO[type as keyof typeof FORMAT_INFO]?.name || type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowDateDropdown(!showDateDropdown);
                    setShowTypeDropdown(false);
                  }}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#1a1f28] hover:bg-[#282e39] border border-[#282e39] text-gray-300 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <span>
                    {dateFilter === 'all' ? 'Date Created' :
                     dateFilter === 'today' ? 'Today' :
                     dateFilter === 'week' ? 'This Week' :
                     dateFilter === 'month' ? 'This Month' :
                     dateFilter === 'year' ? 'This Year' : 'Date Created'}
                  </span>
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
                {showDateDropdown && (
                  <div className="absolute top-full mt-2 left-0 w-48 bg-[#1a1f28] border border-[#282e39] rounded-lg shadow-lg z-50 py-2">
                    {[
                      { value: 'all', label: 'All Time' },
                      { value: 'today', label: 'Today' },
                      { value: 'week', label: 'This Week' },
                      { value: 'month', label: 'This Month' },
                      { value: 'year', label: 'This Year' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setDateFilter(option.value);
                          setShowDateDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[#282e39] transition-colors ${
                          dateFilter === option.value ? 'text-primary font-medium' : 'text-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center p-1 bg-[#1a1f28] rounded-lg border border-[#282e39]">
            <button
              onClick={() => setViewMode('grid')}
              className={`size-8 flex items-center justify-center rounded transition-all ${
                viewMode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`size-8 flex items-center justify-center rounded transition-all ${
                viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* No Results Message */}
        {!loading && !error && filteredVisualizations.length === 0 && visualizations.length > 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">search_off</span>
            <h3 className="text-xl font-bold text-white mb-2">No visualizations found</h3>
            <p className="text-gray-400 text-center">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && visualizations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">add_chart</span>
            <h3 className="text-xl font-bold text-white mb-2">No visualizations yet</h3>
            <p className="text-gray-400 text-center mb-4">Create your first visualization to get started</p>
            <a
              href="/dashboard"
              className="px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Create Visualization
            </a>
          </div>
        )}

        {/* Visualization Grid */}
        {!loading && !error && filteredVisualizations.length > 0 && (
          <div className={viewMode === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "flex flex-col gap-4"
          }>
            {filteredVisualizations.map((viz) => {
              const formatInfo = FORMAT_INFO[viz.type as keyof typeof FORMAT_INFO];
              const color = badgeColors[viz.type] || badgeColors.network_graph;

              return (
                <div key={viz._id} className={`group relative flex ${viewMode === 'list' ? 'flex-row' : 'flex-col'} rounded-xl bg-[#1a1f28] border border-[#282e39] overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-primary/5`}>
                  <div className={`relative ${viewMode === 'list' ? 'w-48' : 'aspect-[4/3] w-full'} bg-gradient-to-br from-[#282e39] to-[#1a1f28] overflow-hidden flex items-center justify-center`}>
                    <span className="text-6xl text-white/10 group-hover:scale-110 transition-transform duration-500">{formatInfo?.icon || '📊'}</span>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === viz._id ? null : viz._id || null);
                          }}
                          className="size-8 flex items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                        {activeMenuId === viz._id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-full right-0 mt-2 w-48 bg-[#1a1f28] border border-[#282e39] rounded-lg shadow-xl z-50 py-2"
                          >
                            <button
                              onClick={() => {
                                window.location.href = `/dashboard?viz=${viz._id}`;
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#282e39] transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                              View
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Implement download
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#282e39] transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[18px]">download</span>
                              Download
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmId(viz._id || null);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium backdrop-blur-md ${color}`}>
                        {formatInfo?.name || viz.type}
                      </span>
                    </div>
                  </div>
                  <div className={`flex flex-col p-4 gap-2 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <h3 className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors cursor-pointer">{viz.title}</h3>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#282e39]/50">
                      <span className="text-xs text-gray-500">Edited {getRelativeTime(viz.updatedAt)}</span>
                      <div className="flex items-center gap-2">
                        <button className="text-gray-400 hover:text-primary transition-colors" title="Download">
                          <span className="material-symbols-outlined text-[18px]">download</span>
                        </button>
                        <button className="text-gray-400 hover:text-primary transition-colors" title="Share">
                          <span className="material-symbols-outlined text-[18px]">share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f28] border border-[#282e39] rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 size-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-500 text-2xl">delete</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Delete Visualization</h3>
                  <p className="text-sm text-gray-400">
                    Are you sure you want to delete this visualization? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg border border-[#282e39] text-gray-300 text-sm font-medium hover:bg-[#282e39] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
