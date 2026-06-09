'use client';

import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import type { SavedVisualization } from '@/lib/types/visualization';
import EChartsRenderer from '@/components/visualizations/EChartsRenderer';

export default function SharedVisualizationView({ visualization }: { visualization: SavedVisualization }) {
  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-zinc-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">V</Link>
          <span className="text-zinc-500 text-sm shrink-0">VisualMe</span>
          <span className="text-zinc-700 shrink-0">/</span>
          <span className="text-zinc-300 text-sm font-medium truncate">{visualization.title}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-zinc-400 border border-white/8 flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3" /> Visualization
          </span>
          <Link
            href="/sign-up"
            className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-400 transition-colors"
          >
            Try VisualMe free
          </Link>
        </div>
      </header>

      {/* Viz — flex-1 min-h-0 so the absolute child can resolve its height */}
      <div className="flex-1 min-h-0 relative">
        <EChartsRenderer spec={visualization.spec} className="absolute inset-0 p-8" />
      </div>

      {/* Footer */}
      <footer className="h-10 shrink-0 flex items-center justify-center border-t border-white/5 text-xs text-zinc-600">
        Shared via{' '}
        <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors ml-1">VisualMe</Link>
      </footer>
    </div>
  );
}
