'use client';

import { getUserVisualizations, deleteVisualization, duplicateVisualization } from '@/lib/actions/visualize';
import Header from '@/components/dashboard/Header';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import type { SavedVisualization } from '@/lib/types/visualization';
import type { VisualizationSpec } from '@/lib/types/echarts-spec';
import VisualizationModal from '@/components/visualizations/VisualizationModal';
import EChartsRenderer from '@/components/visualizations/EChartsRenderer';
import { getChartTypeInfo, getSeriesType } from '@/lib/utils/series-icon';
import { STARTER_TEMPLATES } from '@/lib/utils/starter-templates';
import { relativeTime } from '@/lib/utils/helpers';
import Link from 'next/link';
import {
  Search, Grid, List, SearchX, Plus, Trash2, BarChart3,
  ArrowUpDown, ChevronDown, CheckSquare, Square, TrendingUp,
  FlaskConical, ClipboardList, Workflow, Megaphone, Wallet, Activity, Target, Sparkles, Copy,
} from 'lucide-react';

type SortKey = 'updated' | 'created' | 'name' | 'type';

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  TrendingUp, FlaskConical, ClipboardList, Workflow, Megaphone, Wallet, Activity, Target,
};

/**
 * Renders the real chart only once scrolled near the viewport.
 */
function ChartPreview({ spec }: { spec: VisualizationSpec }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0">
      {visible ? (
        <EChartsRenderer spec={spec} compact hideTitle className="w-full h-full" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-ink-faint/40 group-hover:text-accent/40 transition-colors">
          <BarChart3 size={44} strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}

function VisualizationsContent() {
  const [visualizations, setVisualizations] = useState<SavedVisualization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViz, setSelectedViz] = useState<SavedVisualization | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDuplicating, setBulkDuplicating] = useState(false);

  useEffect(() => {
    getUserVisualizations().then(res => {
      if (res.success && res.data) setVisualizations(res.data as SavedVisualization[]);
      else toast.error(res.error || 'Failed to load visualizations');
      setLoading(false);
    }).catch(() => { toast.error('An unexpected error occurred'); setLoading(false); });
  }, []);

  /* Close sort dropdown on outside click */
  useEffect(() => {
    if (!sortOpen) return;
    const close = (e: MouseEvent) => { if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [sortOpen]);

  const doDelete = async (id: string) => {
    try {
      const result = await deleteVisualization(id);
      if (result.success) {
        setVisualizations(prev => prev.filter(v => v._id !== id));
        setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
        toast.success('Deleted');
        if (selectedViz?._id === id) setSelectedViz(null);
      } else toast.error(result.error || 'Failed to delete');
    } catch { toast.error('An unexpected error occurred'); }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toast('Delete this visualization?', {
      action: { label: 'Delete', onClick: () => doDelete(id) },
      cancel: { label: 'Cancel', onClick: () => {} },
      duration: 5000,
    });
  };

  const handleBulkDuplicate = async () => {
    if (!selected.size) return;
    setBulkDuplicating(true);
    const ids = [...selected];
    try {
      const results = await Promise.all(ids.map(id => duplicateVisualization(id)));
      const copies = results.flatMap(r => (r.success && r.data ? [r.data as SavedVisualization] : []));
      if (copies.length) {
        setVisualizations(prev => [...copies, ...prev]);
        toast.success(`Duplicated ${copies.length} visualization${copies.length > 1 ? 's' : ''}`);
      }
      const failed = results.filter(r => !r.success).length;
      if (failed) toast.error(`${failed} duplication${failed > 1 ? 's' : ''} failed`);
    } catch {
      toast.error('An unexpected error occurred while duplicating');
    } finally {
      setSelected(new Set());
      setSelectMode(false);
      setBulkDuplicating(false);
    }
  };

  const handleBulkDelete = () => {
    if (!selected.size) return;
    toast(`Delete ${selected.size} visualization${selected.size > 1 ? 's' : ''}?`, {
      action: {
        label: 'Delete all',
        onClick: async () => {
          setBulkDeleting(true);
          const ids = [...selected];
          try {
            await Promise.all(ids.map(id => deleteVisualization(id)));
            setVisualizations(prev => prev.filter(v => !ids.includes(v._id!)));
            toast.success(`Deleted ${ids.length} visualization${ids.length > 1 ? 's' : ''}`);
          } catch {
            toast.error('An unexpected error occurred while deleting');
          } finally {
            setSelected(new Set());
            setSelectMode(false);
            setBulkDeleting(false);
          }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
      duration: 5000,
    });
  };

  const handleVisualizationUpdate = (updatedViz: SavedVisualization) => {
    setVisualizations(prev => prev.map(v => v._id === updatedViz._id ? updatedViz : v));
    setSelectedViz(updatedViz);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  /* Collect unique chart types for filter chips */
  const chartTypes = [...new Set(visualizations.map(v => getSeriesType(v.spec.option)).filter(Boolean) as string[])];

  const SORT_LABELS: Record<SortKey, string> = {
    updated: 'Last edited', created: 'Date created', name: 'Name', type: 'Chart type',
  };

  const sorted = [...visualizations].sort((a, b) => {
    switch (sortKey) {
      case 'name': return a.title.localeCompare(b.title);
      case 'type': return (getSeriesType(a.spec.option) ?? '').localeCompare(getSeriesType(b.spec.option) ?? '');
      case 'created': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default: return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    }
  });

  const filtered = sorted.filter(viz => {
    const matchesSearch = viz.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || getSeriesType(viz.spec.option) === typeFilter;
    return matchesSearch && matchesType;
  });

  const allSelected = filtered.length > 0 && filtered.every(v => selected.has(v._id!));

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-6 pt-24">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink mb-1">My Visualizations</h1>
          <p className="text-ink-muted text-sm">{visualizations.length} saved chart{visualizations.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Search by name…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg text-sm w-48 md:w-56 bg-surface-2 border border-edge text-ink placeholder:text-ink-faint outline-none focus:border-accent/40 transition-colors"
            />
          </div>

          {/* Sort */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen(p => !p)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-ink-faint hover:text-ink border border-edge bg-surface-2 hover:bg-surface-3 transition-colors"
            >
              <ArrowUpDown size={13} />
              <span className="hidden sm:inline">{SORT_LABELS[sortKey]}</span>
              <ChevronDown size={12} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden z-50 bg-surface-2 border border-edge shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
                {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setSortKey(key); setSortOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors hover:bg-surface-3 ${sortKey === key ? 'text-accent' : 'text-ink-muted'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Select mode toggle */}
          {visualizations.length > 0 && (
            <button
              onClick={() => { setSelectMode(p => !p); setSelected(new Set()); }}
              className={`h-9 px-3 rounded-lg text-sm font-medium border transition-colors ${selectMode ? 'border-accent/40 bg-accent/8 text-accent' : 'border-edge bg-surface-2 text-ink-faint hover:text-ink hover:bg-surface-3'}`}
            >
              {selectMode ? 'Cancel' : 'Select'}
            </button>
          )}

          {/* View toggle */}
          <div className="flex p-1 rounded-lg bg-surface-2 border border-edge">
            <button onClick={() => setViewMode('grid')} title="Grid view" className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-accent/12 text-accent' : 'text-ink-faint hover:text-ink'}`}>
              <Grid size={15} />
            </button>
            <button onClick={() => setViewMode('list')} title="List view" className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-accent/12 text-accent' : 'text-ink-faint hover:text-ink'}`}>
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Chart type filter chips */}
      {chartTypes.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          <button
            onClick={() => setTypeFilter(null)}
            className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${!typeFilter ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface-1 border-edge text-ink-faint hover:text-ink hover:border-surface-3'}`}
          >
            All
          </button>
          {chartTypes.map(type => {
            const { Icon, label } = getChartTypeInfo({ series: [{ type }] } as never);
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border transition-colors ${typeFilter === type ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface-1 border-edge text-ink-faint hover:text-ink hover:border-surface-3'}`}
              >
                <Icon size={11} />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Bulk actions bar */}
      {selectMode && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl bg-surface-1 border border-edge">
          <button
            onClick={() => {
              if (allSelected) setSelected(new Set());
              else setSelected(new Set(filtered.map(v => v._id!)));
            }}
            className="flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
          >
            {allSelected ? <CheckSquare size={14} className="text-accent" /> : <Square size={14} />}
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          <span className="text-xs text-ink-faint">{selected.size} selected</span>
          <div className="flex-1" />
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDuplicate}
                disabled={bulkDuplicating || bulkDeleting}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-edge text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors disabled:opacity-50"
              >
                {bulkDuplicating
                  ? <div className="w-3 h-3 border-2 border-ink-faint/30 border-t-ink-muted rounded-full animate-spin" />
                  : <Copy size={12} />}
                Duplicate {selected.size}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting || bulkDuplicating}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-danger/30 text-danger hover:bg-danger/8 transition-colors disabled:opacity-50"
              >
                <Trash2 size={12} />
                Delete {selected.size}
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 rounded-xl animate-pulse surface-panel" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-surface-2 border border-edge">
            <SearchX size={36} className="text-ink-faint" />
          </div>
          <h3 className="text-xl font-semibold text-ink mb-2">
            {searchQuery || typeFilter ? 'No results' : 'Nothing saved yet'}
          </h3>
          <p className="text-ink-muted text-sm max-w-md mx-auto mb-8 text-center">
            {searchQuery || typeFilter
              ? 'Try adjusting your search or filter.'
              : 'Create a visualization in the playground and save it — it\'ll appear here.'}
          </p>

          {!searchQuery && !typeFilter && (
            <>
              <Link href="/dashboard" className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 bg-accent text-surface-0 hover:bg-accent-hover mb-10">
                <Plus size={15} /> Open Playground
              </Link>

              {/* Starter templates */}
              <div className="w-full max-w-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} className="text-accent/70" />
                  <p className="text-xs font-semibold text-ink-faint uppercase tracking-wider">Or start from a template</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STARTER_TEMPLATES.slice(0, 6).map(template => {
                    const Icon = TEMPLATE_ICONS[template.icon] ?? Sparkles;
                    return (
                      <Link
                        key={template.id}
                        href={`/dashboard?template=${template.id}`}
                        className="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface-1 border border-edge hover:bg-accent/5 hover:border-accent/20 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-accent/10 border border-accent/20">
                          <Icon size={13} className="text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-ink truncate group-hover:text-accent transition-colors">{template.title}</p>
                          <p className="text-[11px] text-ink-faint leading-snug mt-0.5 line-clamp-1">{template.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(viz => {
            const { Icon: ChartIcon, label: chartLabel } = getChartTypeInfo(viz.spec.option);
            const isSelected = selected.has(viz._id!);
            return (
              <div
                key={viz._id}
                onClick={() => selectMode ? toggleSelect(viz._id!) : setSelectedViz(viz)}
                className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all surface-panel hover:border-accent/30 ${isSelected ? 'border-accent/50 bg-accent/4' : ''}`}
              >
                {/* Select checkbox */}
                {selectMode && (
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${isSelected ? 'bg-accent border-accent' : 'bg-surface-0/70 border-edge'}`}>
                      {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </div>
                )}

                {/* Preview area */}
                <div className="relative overflow-hidden bg-surface-2 h-40 w-full">
                  <ChartPreview spec={viz.spec} />
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        {/* Chart type badge */}
                        <div
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0"
                          style={{ background: 'oklch(72% 0.13 55 / 0.08)', color: 'var(--color-accent)' }}
                        >
                          <ChartIcon size={9} />
                          <span className="hidden sm:inline">{chartLabel}</span>
                        </div>
                        {viz.liveData?.url && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-success shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" style={{ boxShadow: '0 0 4px var(--color-success)' }} />
                            Live
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-ink group-hover:text-accent transition-colors line-clamp-1 text-[13.5px]">
                        {viz.title}
                      </h3>
                      <p className="text-[11px] text-ink-faint mt-0.5">
                        {viz.liveData?.lastRefreshed
                          ? `Refreshed ${relativeTime(viz.liveData.lastRefreshed)}`
                          : `Edited ${relativeTime(viz.updatedAt || viz.createdAt)}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delete button — hidden in select mode */}
                {!selectMode && (
                  <div className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => handleDelete(e, viz._id!)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm transition-colors bg-surface-0/70 text-ink-muted hover:text-danger hover:bg-danger/15 border border-edge"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List mode — dense table */
        <div className="rounded-xl overflow-hidden border border-edge">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge bg-surface-1">
                {selectMode && (
                  <th className="w-10 px-3 py-2.5">
                    <button onClick={() => allSelected ? setSelected(new Set()) : setSelected(new Set(filtered.map(v => v._id!)))}>
                      {allSelected
                        ? <CheckSquare size={14} className="text-accent" />
                        : <Square size={14} className="text-ink-faint" />}
                    </button>
                  </th>
                )}
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-ink-faint uppercase tracking-wide">Name</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-ink-faint uppercase tracking-wide hidden md:table-cell">Type</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-ink-faint uppercase tracking-wide hidden sm:table-cell">Status</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-ink-faint uppercase tracking-wide">Last edited</th>
                <th className="w-12 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {filtered.map(viz => {
                const { Icon: ChartIcon, label: chartLabel } = getChartTypeInfo(viz.spec.option);
                const isSelected = selected.has(viz._id!);
                return (
                  <tr
                    key={viz._id}
                    onClick={() => selectMode ? toggleSelect(viz._id!) : setSelectedViz(viz)}
                    className={`group cursor-pointer transition-colors hover:bg-surface-1 ${isSelected ? 'bg-accent/4' : ''}`}
                  >
                    {selectMode && (
                      <td className="px-3 py-3">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-accent border-accent' : 'border-edge'}`}>
                          {isSelected && <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink group-hover:text-accent transition-colors line-clamp-1 text-[13px]">{viz.title}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold"
                        style={{ background: 'oklch(72% 0.13 55 / 0.08)', color: 'var(--color-accent)' }}
                      >
                        <ChartIcon size={10} />
                        {chartLabel}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {viz.liveData?.url ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" style={{ boxShadow: '0 0 4px var(--color-success)' }} />
                          Live
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-faint">Saved</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-ink-faint">
                      {viz.liveData?.lastRefreshed
                        ? relativeTime(viz.liveData.lastRefreshed)
                        : relativeTime(viz.updatedAt || viz.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      {!selectMode && (
                        <button
                          onClick={e => handleDelete(e, viz._id!)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
  return (
    <div className="min-h-screen bg-surface-0 relative selection:bg-accent/20">
      <Header label="Library" />
      <VisualizationsContent />
    </div>
  );
}
