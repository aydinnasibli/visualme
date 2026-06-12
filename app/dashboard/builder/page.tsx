import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserVisualizations } from '@/lib/actions/visualize';
import { getUserDashboards } from '@/lib/actions/dashboard';
import DashboardBuilder from '@/components/dashboard/DashboardBuilder';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Builder — VisualMe',
};

export default async function DashboardBuilderPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [vizRes, dashRes] = await Promise.all([
    getUserVisualizations(),
    getUserDashboards(),
  ]);

  const vizzes = (vizRes.success && vizRes.data) ? vizRes.data : [];
  const dashboards = (dashRes.success && dashRes.data) ? dashRes.data : [];

  return <DashboardBuilder initialVizzes={vizzes} initialDashboards={dashboards} />;
}
