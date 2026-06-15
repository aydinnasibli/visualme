'use client';

import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import type { SavedVisualization } from '@/lib/types/visualization';
import EChartsRenderer from '@/components/visualizations/EChartsRenderer';

export default function SharedVisualizationView({ visualization }: { visualization: SavedVisualization }) {
  return (
    <div className="h-screen flex flex-col bg-surface-0 overflow-hidden">
      {/* Header */}
      <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-edge">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="w-7 h-7 rounded-lg bg-surface-2 border border-edge flex items-center justify-center text-accent font-display font-semibold text-sm shrink-0">V</Link>
          <span className="text-ink-faint text-sm shrink-0">VisualMe</span>
          <span className="text-edge shrink-0">/</span>
          <span className="text-ink text-sm font-medium truncate">{visualization.title}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface-2 text-ink-faint border border-edge flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3" /> Visualization
          </span>
          <Link
            href="/sign-up"
            className="px-3 py-1.5 rounded-lg bg-accent text-surface-0 text-xs font-medium hover:bg-accent-hover transition-colors"
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
      <footer className="h-10 shrink-0 flex items-center justify-center border-t border-edge text-xs text-ink-faint">
        Shared via{' '}
        <Link href="/" className="text-ink-faint hover:text-ink transition-colors ml-1">VisualMe</Link>
      </footer>
    </div>
  );
}
