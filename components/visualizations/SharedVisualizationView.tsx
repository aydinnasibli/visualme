'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Copy, Check, Code2, ExternalLink } from 'lucide-react';
import type { SavedVisualization } from '@/lib/types/visualization';
import EChartsRenderer from '@/components/visualizations/EChartsRenderer';
import { getChartTypeInfo } from '@/lib/utils/series-icon';
import { toast } from 'sonner';

export default function SharedVisualizationView({ visualization }: { visualization: SavedVisualization }) {
  const [embedCopied, setEmbedCopied] = useState(false);
  const { Icon: ChartIcon, label: chartLabel } = getChartTypeInfo(visualization.spec.option);
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${visualization.shareId}`
    : `/share/${visualization.shareId}`;

  const handleCopyEmbed = () => {
    const embedUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/share/${visualization.shareId}?embed=1`
      : `/share/${visualization.shareId}?embed=1`;
    const code = `<iframe src="${embedUrl}" width="800" height="500" frameborder="0" style="border-radius:12px;"></iframe>`;
    navigator.clipboard.writeText(code).then(() => {
      setEmbedCopied(true);
      toast.success('Embed code copied');
      setTimeout(() => setEmbedCopied(false), 2000);
    });
  };

  return (
    <div className="h-screen flex flex-col bg-surface-0 overflow-hidden">
      {/* Header */}
      <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-edge">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="w-7 h-7 rounded-lg bg-surface-2 border border-edge flex items-center justify-center text-accent font-display font-semibold text-sm shrink-0">V</Link>
          <span className="text-ink-faint text-sm shrink-0">Visuologia</span>
          <span className="text-edge shrink-0">/</span>
          <span className="text-ink text-sm font-medium truncate">{visualization.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Chart type badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md"
            style={{ background: 'oklch(72% 0.13 55 / 0.08)', border: '1px solid oklch(72% 0.13 55 / 0.18)' }}
          >
            <ChartIcon size={11} className="text-accent" />
            <span className="text-[11px] font-semibold text-accent">{chartLabel}</span>
          </div>

          {/* Embed code button */}
          <button
            onClick={handleCopyEmbed}
            title="Copy embed code"
            className="hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium text-ink-faint hover:text-ink hover:bg-surface-2 border border-edge transition-colors"
          >
            {embedCopied ? <Check size={12} className="text-success" /> : <Code2 size={12} />}
            {embedCopied ? 'Copied!' : 'Embed'}
          </button>

          <Link
            href={`/dashboard?prompt=${encodeURIComponent(visualization.metadata?.originalInput || visualization.title)}`}
            className="hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium text-ink-faint hover:text-ink hover:bg-surface-2 border border-edge transition-colors"
          >
            <ExternalLink size={12} />
            Try this prompt
          </Link>

          <Link
            href="/sign-up"
            className="px-3 py-1.5 rounded-lg bg-accent text-surface-0 text-xs font-semibold hover:bg-accent-hover transition-colors"
          >
            Try Visuologia free
          </Link>
        </div>
      </header>

      {/* Viz — flex-1 min-h-0 so the absolute child can resolve its height */}
      <div className="flex-1 min-h-0 relative">
        <EChartsRenderer spec={visualization.spec} className="absolute inset-0 p-8" />
      </div>

      {/* Key takeaway */}
      {visualization.spec.narrative && (
        <div className="shrink-0 border-t border-edge bg-surface-1 px-8 py-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={13} className="text-accent" />
            <span className="text-[11px] font-semibold text-ink-faint uppercase tracking-wider">Key takeaway</span>
          </div>
          <p className="text-[13px] text-ink-muted leading-relaxed max-w-3xl">{visualization.spec.narrative}</p>
        </div>
      )}

      {/* Footer */}
      <footer className="h-10 shrink-0 flex items-center justify-center border-t border-edge text-xs text-ink-faint">
        Shared via{' '}
        <Link href="/" className="text-ink-faint hover:text-ink transition-colors ml-1">Visuologia</Link>
      </footer>
    </div>
  );
}
