import { notFound } from 'next/navigation';
import { getSharedDashboard } from '@/lib/actions/dashboard';
import SharedDashboardView from '@/components/visualizations/SharedDashboardView';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ dashboardId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dashboardId } = await params;
  const res = await getSharedDashboard(dashboardId);
  if (!res.success || !res.data) return { title: 'Dashboard — VisualMe' };
  return {
    title: `${res.data.title} — VisualMe`,
    description: `${res.data.slots.length} interactive charts shared via VisualMe`,
  };
}

export default async function SharedDashboardPage({ params }: Props) {
  const { dashboardId } = await params;
  const res = await getSharedDashboard(dashboardId);

  if (!res.success || !res.data) notFound();

  return <SharedDashboardView dashboard={res.data} />;
}
