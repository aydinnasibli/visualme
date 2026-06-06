'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserVisualizations, deleteVisualization } from '@/lib/actions/visualize';
import { toast } from 'sonner';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface SavedVizLite {
  _id: string;
  title: string;
  type: string;
  createdAt: string | Date;
}

export default function HistorySidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentId = searchParams.get('id');

  const [visualizations, setVisualizations] = useState<SavedVizLite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisualizations = async () => {
    try {
      const result = await getUserVisualizations(50);
      if (result.success && result.data) setVisualizations(result.data as SavedVizLite[]);
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
    }
  };

  /* Only fetch on mount — the list doesn't change just because we navigate to a different ID */
  useEffect(() => {
    fetchVisualizations();
  }, []);

  const doDelete = async (id: string) => {
    try {
      const result = await deleteVisualization(id);
      if (result.success) {
        toast.success('Deleted');
        setVisualizations(prev => prev.filter(v => v._id !== id));
        if (currentId === id) router.push('/dashboard');
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch {
      toast.error('An error occurred');
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

  const handleSelect = (id: string) => router.push(`/dashboard?id=${id}`);

  return (
    <div className="w-64 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0 z-30">
      {/* New Visualization */}
      <div className="p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-3 rounded-lg border border-zinc-800 hover:bg-zinc-800/50 transition-colors text-white mb-2 group"
        >
          <div className="size-6 rounded-md bg-white/10 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">New Visualization</span>
        </Link>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
        <h3 className="text-xs font-semibold text-zinc-500 px-3 py-2 uppercase tracking-wider">Recent</h3>

        {loading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-zinc-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : visualizations.length === 0 ? (
          <div className="px-3 py-4 text-center text-zinc-500 text-sm">No history yet.</div>
        ) : (
          <div className="space-y-1">
            {visualizations.map((viz) => (
              <div
                key={viz._id}
                onClick={() => handleSelect(viz._id)}
                className={`relative group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all ${
                  currentId === viz._id
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium truncate">{viz.title || 'Untitled'}</p>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5 capitalize">
                    {viz.type ? viz.type.replace(/_/g, ' ') : 'Unknown'} · {new Date(viz.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {/* Delete — always in DOM, visible on hover via CSS only */}
                <button
                  onClick={(e) => handleDelete(e, viz._id)}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
