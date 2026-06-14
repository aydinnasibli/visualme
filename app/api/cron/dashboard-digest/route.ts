import { type NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/mongodb';
import { DashboardModel, VisualizationModel, UserModel } from '@/lib/database/models';
import { fetchAndParseSheet } from '@/lib/utils/sheet-fetch';
import { refreshChartData } from '@/lib/utils/chart-data-refresh';
import { sendDashboardDigest, type DigestChartSummary } from '@/lib/services/email-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Guards against the cron firing more than once on the same UTC day.
const LAST_SENT_COOLDOWN_MS = 20 * 60 * 60 * 1000;

/**
 * Daily cron (see vercel.json) — finds dashboards whose weekly digest is due
 * today, re-fetches each connected live sheet, patches chart data in place
 * (no AI calls), and emails the owner a summary.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();

  const now = new Date();
  const todayUTC = now.getUTCDay();

  const dueDashboards = await DashboardModel.find({
    'schedule.enabled': true,
    'schedule.dayOfWeek': todayUTC,
  });

  let processed = 0;
  let sent = 0;

  for (const dashboard of dueDashboards) {
    const lastSentAt = dashboard.schedule?.lastSentAt;
    if (lastSentAt && now.getTime() - new Date(lastSentAt as unknown as string).getTime() < LAST_SENT_COOLDOWN_MS) {
      continue;
    }

    try {
      processed++;

      const vizIds = dashboard.slots.map(s => s.vizId).filter(Boolean);
      const vizDocs = vizIds.length
        ? await VisualizationModel.find({ _id: { $in: vizIds }, userId: dashboard.userId })
        : [];

      const charts: DigestChartSummary[] = [];

      for (const viz of vizDocs) {
        const url = viz.liveData?.url;
        if (!url) continue;

        const sheet = await fetchAndParseSheet(url);
        if (!sheet.ok) {
          charts.push({ title: viz.title, refreshed: false, summary: `Couldn't fetch live data: ${sheet.error}` });
          continue;
        }

        const result = refreshChartData(viz.spec.option, sheet);
        charts.push({ title: viz.title, refreshed: result.refreshed, summary: result.summary });

        if (result.refreshed) {
          await VisualizationModel.updateOne(
            { _id: viz._id },
            { $set: { 'spec.option': result.option, 'liveData.lastRefreshed': now.toISOString() } }
          );
        }
      }

      if (charts.length > 0) {
        const user = await UserModel.findOne({ clerkId: dashboard.userId }).select('email');
        if (user?.email) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const dashboardUrl =
            dashboard.isPublic && dashboard.dashboardId
              ? `${baseUrl}/share/dashboard/${dashboard.dashboardId}`
              : `${baseUrl}/dashboard/builder`;

          await sendDashboardDigest({
            to: user.email,
            dashboardTitle: dashboard.title,
            dashboardUrl,
            charts,
          });
          sent++;
        }
      }

      await DashboardModel.updateOne({ _id: dashboard._id }, { $set: { 'schedule.lastSentAt': now } });
    } catch (err) {
      console.error(`[cron/dashboard-digest] Failed for dashboard ${dashboard._id}:`, err);
    }
  }

  return NextResponse.json({ processed, sent });
}
