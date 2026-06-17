import { notFound } from 'next/navigation';
import { getSharedVisualization } from '@/lib/actions/export';
import SharedVisualizationView from '@/components/visualizations/SharedVisualizationView';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ shareId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;
  const res = await getSharedVisualization(shareId);
  if (!res.success || !res.data) return { title: 'Visualization — VisualMe' };
  return {
    title: `${res.data.title} — VisualMe`,
    description: `Interactive visualization shared via VisualMe`,
    openGraph: {
      title: `${res.data.title} — VisualMe`,
      description: `Interactive visualization shared via VisualMe`,
      type: 'website',
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { shareId } = await params;
  const res = await getSharedVisualization(shareId);

  if (!res.success || !res.data) {
    notFound();
  }

  return <SharedVisualizationView visualization={res.data} />;
}
