'use server';

import { auth } from '@clerk/nextjs/server';
import { nanoid } from 'nanoid';
import { connectToDatabase } from '@/lib/database/mongodb';
import { DashboardModel, VisualizationModel } from '@/lib/database/models';
import { validateObjectId, sanitizeError } from '@/lib/utils/validation';
import { sanitizeVisualization } from '@/lib/utils/helpers';
import { fetchAndParseSheet } from '@/lib/utils/sheet-fetch';
import { refreshChartData } from '@/lib/utils/chart-data-refresh';
import type { EChartsOption } from 'echarts';
import type { Dashboard, DashboardLayoutItem, DashboardSchedule, DashboardVizSlot, DashboardWithVizzes } from '@/lib/types/dashboard';

const MAX_SLOTS = 12;

interface RawDashboardDoc {
  toObject?: () => Record<string, unknown>;
  [key: string]: unknown;
}

interface RawSlot {
  vizId?: unknown;
  titleSnapshot?: unknown;
}

interface RawLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

interface RawSchedule {
  enabled?: unknown;
  dayOfWeek?: unknown;
  lastSentAt?: unknown;
}

const toIsoString = (value: unknown): string | undefined =>
  value ? new Date(value as string | number | Date).toISOString() : undefined;

function sanitizeSchedule(raw: unknown): DashboardSchedule | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const s = raw as RawSchedule;
  if (typeof s.enabled !== 'boolean') return undefined;
  return {
    enabled: s.enabled,
    dayOfWeek: typeof s.dayOfWeek === 'number' ? s.dayOfWeek : 1,
    ...(s.lastSentAt ? { lastSentAt: toIsoString(s.lastSentAt) } : {}),
  };
}

function sanitizeDashboard(doc: unknown): Dashboard {
  const raw = doc as RawDashboardDoc;
  const obj = typeof raw.toObject === 'function' ? raw.toObject() : raw;

  const slots = obj.slots as RawSlot[] | undefined;
  const layout = obj.layout as RawLayoutItem[] | undefined;

  const result: Dashboard = {
    _id: (obj._id as { toString(): string } | undefined)?.toString(),
    userId: (obj.userId as { toString(): string } | undefined)?.toString() ?? '',
    title: typeof obj.title === 'string' ? obj.title : '',
    dashboardId: typeof obj.dashboardId === 'string' ? obj.dashboardId : undefined,
    isPublic: typeof obj.isPublic === 'boolean' ? obj.isPublic : false,
    createdAt: toIsoString(obj.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoString(obj.updatedAt) ?? new Date().toISOString(),
    slots: Array.isArray(slots)
      ? slots.map((s) => ({
          vizId: s.vizId != null ? String(s.vizId) : '',
          titleSnapshot: typeof s.titleSnapshot === 'string' ? s.titleSnapshot : '',
        }))
      : [],
    layout: Array.isArray(layout)
      ? layout.map((l) => ({
          i: l.i,
          x: l.x,
          y: l.y,
          w: l.w,
          h: l.h,
          ...(l.minW != null ? { minW: l.minW } : {}),
          ...(l.maxW != null ? { maxW: l.maxW } : {}),
          ...(l.minH != null ? { minH: l.minH } : {}),
          ...(l.maxH != null ? { maxH: l.maxH } : {}),
        }))
      : [],
    schedule: sanitizeSchedule(obj.schedule),
  };
  return result;
}

/** Create a new dashboard. */
export async function createDashboard(
  title: string,
  slots: DashboardVizSlot[],
  layout: DashboardLayoutItem[]
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    if (!title?.trim()) return { success: false, error: 'Title is required' };
    if (title.length > 200) return { success: false, error: 'Title too long' };
    if (!slots.length) return { success: false, error: 'Add at least one visualization' };
    if (slots.length > MAX_SLOTS) return { success: false, error: `Maximum ${MAX_SLOTS} visualizations per dashboard` };

    await connectToDatabase();

    const doc = await DashboardModel.create({
      userId,
      title: title.trim(),
      isPublic: false,
      slots,
      layout,
    });

    return { success: true, data: sanitizeDashboard(doc) };
  } catch (error) {
    console.error('createDashboard error:', error);
    return { success: false, error: sanitizeError(error, 'Failed to create dashboard') };
  }
}

/** Update title, slots, and layout of an existing dashboard. */
export async function updateDashboard(
  id: string,
  updates: { title?: string; slots?: DashboardVizSlot[]; layout?: DashboardLayoutItem[] }
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) return { success: false, error: idValidation.error };

    if (updates.title !== undefined) {
      if (!updates.title.trim()) return { success: false, error: 'Title is required' };
      if (updates.title.length > 200) return { success: false, error: 'Title too long' };
    }
    if (updates.slots !== undefined && updates.slots.length > MAX_SLOTS) {
      return { success: false, error: `Maximum ${MAX_SLOTS} visualizations per dashboard` };
    }

    await connectToDatabase();

    const doc = await DashboardModel.findOne({ _id: id, userId });
    if (!doc) return { success: false, error: 'Dashboard not found or unauthorized' };

    if (updates.title !== undefined) doc.title = updates.title.trim();
    if (updates.slots !== undefined) doc.set('slots', updates.slots);
    if (updates.layout !== undefined) doc.set('layout', updates.layout);

    await doc.save();

    return { success: true, data: sanitizeDashboard(doc) };
  } catch (error) {
    console.error('updateDashboard error:', error);
    return { success: false, error: sanitizeError(error, 'Failed to update dashboard') };
  }
}

/** Publish (or unpublish) a dashboard. Generates a stable dashboardId on first publish. */
export async function publishDashboard(id: string, isPublic: boolean) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) return { success: false, error: idValidation.error };

    await connectToDatabase();

    const doc = await DashboardModel.findOne({ _id: id, userId });
    if (!doc) return { success: false, error: 'Dashboard not found or unauthorized' };

    doc.isPublic = isPublic;
    if (isPublic && !doc.dashboardId) {
      doc.dashboardId = nanoid(12);
    }

    await doc.save();

    return { success: true, data: sanitizeDashboard(doc) };
  } catch (error) {
    console.error('publishDashboard error:', error);
    return { success: false, error: sanitizeError(error, 'Failed to publish dashboard') };
  }
}

/** Enable/disable and configure the weekly email digest for a dashboard. */
export async function updateDashboardSchedule(id: string, schedule: { enabled: boolean; dayOfWeek: number }) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) return { success: false, error: idValidation.error };

    if (!Number.isInteger(schedule.dayOfWeek) || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
      return { success: false, error: 'dayOfWeek must be between 0 and 6' };
    }

    await connectToDatabase();

    const doc = await DashboardModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { 'schedule.enabled': schedule.enabled, 'schedule.dayOfWeek': schedule.dayOfWeek } },
      { new: true }
    );
    if (!doc) return { success: false, error: 'Dashboard not found or unauthorized' };

    return { success: true, data: sanitizeDashboard(doc) };
  } catch (error) {
    console.error('updateDashboardSchedule error:', error);
    return { success: false, error: sanitizeError(error, 'Failed to update dashboard schedule') };
  }
}

/** Get all dashboards belonging to the current user. */
export async function getUserDashboards() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required', data: [] };

    await connectToDatabase();

    const docs = await DashboardModel.find({ userId })
      .select('_id userId title dashboardId isPublic slots layout schedule createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    return { success: true, data: docs.map(sanitizeDashboard) };
  } catch (error) {
    console.error('getUserDashboards error:', error);
    return { success: false, error: sanitizeError(error, 'Failed to fetch dashboards'), data: [] };
  }
}

/** Public access — fetch a shared dashboard with all its viz specs. */
export async function getSharedDashboard(dashboardId: string): Promise<{ success: boolean; data?: DashboardWithVizzes; error?: string }> {
  try {
    await connectToDatabase();

    const doc = await DashboardModel.findOne({ dashboardId, isPublic: true }).lean();
    if (!doc) return { success: false, error: 'Dashboard not found or is private' };

    const dashboard = sanitizeDashboard(doc);
    const vizIds = dashboard.slots.map(s => s.vizId);

    // Fetch vizzes as the dashboard owner — no public check needed since the
    // dashboard doc acts as the access grant.
    const vizDocs = await VisualizationModel.find({
      _id: { $in: vizIds },
      userId: dashboard.userId,
    }).lean();

    const vizMap = new Map(vizDocs.map(v => [v._id.toString(), sanitizeVisualization(v)]));
    const vizzes = vizIds.map(id => vizMap.get(id) ?? null);

    return { success: true, data: { ...dashboard, vizzes } };
  } catch (error) {
    console.error('getSharedDashboard error:', error);
    return { success: false, error: sanitizeError(error, 'Failed to fetch shared dashboard') };
  }
}

/**
 * Manually refresh a single visualization's connected live data source —
 * mirrors the scheduled digest cron's per-chart logic (fetch → patch → persist)
 * so a dashboard card's "Refresh" button reflects fresh data immediately
 * instead of waiting for the next cron run.
 */
export async function refreshDashboardVizLiveData(visualizationId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    const idValidation = validateObjectId(visualizationId);
    if (!idValidation.valid) return { success: false, error: idValidation.error };

    await connectToDatabase();

    const viz = await VisualizationModel.findOne({ _id: visualizationId, userId });
    if (!viz) return { success: false, error: 'Visualization not found or unauthorized' };

    const url = viz.liveData?.url;
    if (!url) return { success: false, error: 'This visualization has no connected live data source' };

    const sheet = await fetchAndParseSheet(url);
    if (!sheet.ok) return { success: false, error: sheet.error };

    const result = refreshChartData(viz.spec.option as EChartsOption, sheet);

    if (!result.refreshed) {
      return { success: true, data: { refreshed: false, summary: result.summary } };
    }

    const lastRefreshed = new Date().toISOString();
    await VisualizationModel.updateOne(
      { _id: visualizationId },
      { $set: { 'spec.option': result.option, 'liveData.lastRefreshed': lastRefreshed } }
    );

    return {
      success: true,
      data: { refreshed: true, option: result.option, lastRefreshed, summary: result.summary },
    };
  } catch (error) {
    console.error('refreshDashboardVizLiveData error:', error);
    return { success: false, error: sanitizeError(error, 'Failed to refresh live data') };
  }
}

/** Delete a dashboard. */
export async function deleteDashboard(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) return { success: false, error: idValidation.error };

    await connectToDatabase();

    const result = await DashboardModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return { success: false, error: 'Dashboard not found or unauthorized' };
    }

    return { success: true };
  } catch (error) {
    console.error('deleteDashboard error:', error);
    return { success: false, error: sanitizeError(error, 'Failed to delete dashboard') };
  }
}
