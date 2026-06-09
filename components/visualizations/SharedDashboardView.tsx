'use client';

import { useState } from 'react';
import { GridLayout, useContainerWidth } from 'react-grid-layout';
import Link from 'next/link';
import { BarChart3, LayoutDashboard } from 'lucide-react';
import EChartsRenderer from '@/components/visualizations/EChartsRenderer';
import type { DashboardWithVizzes } from '@/lib/types/dashboard';

const COLS = 12;
const ROW_H = 80;

interface Props {
  dashboard: DashboardWithVizzes;
}

export default function SharedDashboardView({ dashboard }: Props) {
  const { width, containerRef, mounted } = useContainerWidth();

  // Build a slot→viz map for O(1) lookup
  const vizMap = new Map(
    dashboard.vizzes
      .map((v, i) => [dashboard.slots[i]?.vizId, v] as const)
      .filter(([k, v]) => k != null && v != null)
  );

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">

      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-indigo-400 font-bold text-sm">
            V
          </Link>
          <span className="text-zinc-400 text-sm">VisualMe</span>
          <span className="text-zinc-700">/</span>
          <div className="flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-300 text-sm font-medium truncate max-w-xs">{dashboard.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-zinc-400 border border-white/5 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {dashboard.slots.length} chart{dashboard.slots.length !== 1 ? 's' : ''}
          </span>
          <Link
            href="/sign-up"
            className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors"
          >
            Try VisualMe free
          </Link>
        </div>
      </header>

      {/* Grid */}
      <div
        ref={containerRef}
        className="flex-1 w-full"
      >
        {mounted && (
          <GridLayout
            width={width}
            layout={dashboard.layout}
            gridConfig={{ cols: COLS, rowHeight: ROW_H, margin: [12, 12], containerPadding: [16, 16] }}
            dragConfig={{ enabled: false }}
            resizeConfig={{ enabled: false }}
          >
            {dashboard.slots.map(slot => {
              const viz = vizMap.get(slot.vizId) ?? null;
              return (
                <div key={slot.vizId}>
                  <div className="h-full w-full rounded-xl overflow-hidden border border-white/8 bg-slate-900 relative group">
                    {viz ? (
                      <>
                        <EChartsRenderer spec={viz.spec} className="w-full h-full" />
                        <div
                          className="absolute bottom-0 left-0 right-0 px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.9) 60%, transparent)' }}
                        >
                          <span className="text-[10px] font-medium text-zinc-400 truncate block">{viz.title}</span>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-700">
                        <BarChart3 size={24} strokeWidth={1.2} />
                        <span className="text-[11px]">{slot.titleSnapshot}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </GridLayout>
        )}
      </div>

      {/* Footer */}
      <footer className="h-10 flex items-center justify-center border-t border-white/5 text-xs text-zinc-600 shrink-0">
        Shared via{' '}
        <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors ml-1">
          VisualMe
        </Link>
      </footer>
    </div>
  );
}
