import { type NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/mongodb';
import { DashboardModel, VisualizationModel, UserModel } from '@/lib/database/models';
import { fetchAndParseSheet } from '@/lib/utils/sheet-fetch';
import { refreshChartData } from '@/lib/utils/chart-data-refresh';
import { sendDashboardDigest, sendVisualizationDigest, type DigestChartSummary } from '@/lib/services/email-service';

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

  const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');
  if (process.env.VERCEL && !isVercelCron) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

  // Batch-fetch all users for due dashboards in a single query
  const dashboardUserIds = [...new Set(dueDashboards.map(d => d.userId))];
  const dashboardUsers = dashboardUserIds.length
    ? await UserModel.find({ clerkId: { $in: dashboardUserIds } }).select('clerkId email').lean()
    : [];
  const dashboardUserMap = new Map(dashboardUsers.map(u => [u.clerkId, u.email]));

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
        const email = dashboardUserMap.get(dashboard.userId);
        if (email) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const dashboardUrl =
            dashboard.isPublic && dashboard.dashboardId
              ? `${baseUrl}/share/dashboard/${dashboard.dashboardId}`
              : `${baseUrl}/dashboard/builder`;

          // Write lastSentAt before the email send — if the function times out
          // between the send and this write, the next cron run would re-send.
          // A missed digest is preferable to a duplicate.
          await DashboardModel.updateOne({ _id: dashboard._id }, { $set: { 'schedule.lastSentAt': now } });

          await sendDashboardDigest({
            to: email,
            dashboardTitle: dashboard.title,
            dashboardUrl,
            charts,
          });
          sent++;
        }
      }
      // lastSentAt is only written when an email is actually sent above.
      // Dashboards with no live-data slots produce charts.length === 0 and
      // are intentionally left un-stamped so their schedule isn't silently consumed.
    } catch (err) {
      console.error(`[cron/dashboard-digest] Failed for dashboard ${dashboard._id}:`, err);
    }
  }

  // ── Per-visualization digests (Playground/session charts) ──
  const dueVisualizations = await VisualizationModel.find({
    'schedule.enabled': true,
    'schedule.dayOfWeek': todayUTC,
    'liveData.url': { $exists: true, $ne: null },
  });

  // Batch-fetch all users for due visualizations in a single query
  const vizUserIds = [...new Set(dueVisualizations.map(v => v.userId))];
  const vizUsers = vizUserIds.length
    ? await UserModel.find({ clerkId: { $in: vizUserIds } }).select('clerkId email').lean()
    : [];
  const vizUserMap = new Map(vizUsers.map(u => [u.clerkId, u.email]));

  for (const viz of dueVisualizations) {
    const lastSentAt = viz.schedule?.lastSentAt;
    if (lastSentAt && now.getTime() - new Date(lastSentAt as unknown as string).getTime() < LAST_SENT_COOLDOWN_MS) {
      continue;
    }

    try {
      processed++;

      const url = viz.liveData!.url;
      let summary: DigestChartSummary;

      const sheet = await fetchAndParseSheet(url);
      if (!sheet.ok) {
        summary = { title: viz.title, refreshed: false, summary: `Couldn't fetch live data: ${sheet.error}` };
      } else {
        const result = refreshChartData(viz.spec.option, sheet);
        summary = { title: viz.title, refreshed: result.refreshed, summary: result.summary };

        if (result.refreshed) {
          await VisualizationModel.updateOne(
            { _id: viz._id },
            { $set: { 'spec.option': result.option, 'liveData.lastRefreshed': now.toISOString() } }
          );
        }
      }

      const email = vizUserMap.get(viz.userId);
      if (email) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const chartUrl =
          viz.isPublic && viz.shareId
            ? `${baseUrl}/share/${viz.shareId}`
            : `${baseUrl}/my-visualizations`;

        // Write lastSentAt before the email send — same reasoning as dashboards above.
        await VisualizationModel.updateOne({ _id: viz._id }, { $set: { 'schedule.lastSentAt': now } });

        await sendVisualizationDigest({
          to: email,
          chartTitle: viz.title,
          chartUrl,
          summary,
        });
        sent++;
      }
    } catch (err) {
      console.error(`[cron/dashboard-digest] Failed for visualization ${viz._id}:`, err);
    }
  }

  return NextResponse.json({ processed, sent });
}
