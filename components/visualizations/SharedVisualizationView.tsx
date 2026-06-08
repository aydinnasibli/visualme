'use client';

import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import type { SavedVisualization } from '@/lib/types/visualization';
import EChartsRenderer from '@/components/visualizations/EChartsRenderer';

export default function SharedVisualizationView({ visualization }: { visualization: SavedVisualization }) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-indigo-400 font-bold text-sm">V</Link>
          <span className="text-zinc-400 text-sm">VisualMe</span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-300 text-sm font-medium truncate max-w-xs">{visualization.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-zinc-400 border border-white/5 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" /> Chart
          </span>
          <Link
            href="/sign-up"
            className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors"
          >
            Try VisualMe free
          </Link>
        </div>
      </header>

      {/* Viz */}
      <div className="flex-1 relative">
        <EChartsRenderer spec={visualization.spec} className="w-full h-full p-6" />
      </div>

      {/* Footer */}
      <footer className="h-10 flex items-center justify-center border-t border-white/5 text-xs text-zinc-600">
        Shared via{' '}
        <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors ml-1">VisualMe</Link>
      </footer>
    </div>
  );
}
