import { notFound } from 'next/navigation';
import { getSharedVisualization } from '@/lib/actions/export';
import SharedVisualizationView from '@/components/visualizations/SharedVisualizationView';

interface Props {
  params: Promise<{ shareId: string }>;
}

export default async function SharePage({ params }: Props) {
  const { shareId } = await params;
  const res = await getSharedVisualization(shareId);

  if (!res.success || !res.data) {
    notFound();
  }

  return <SharedVisualizationView visualization={res.data as any} />;
}
