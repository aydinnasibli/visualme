import type { LayoutItem } from 'react-grid-layout';
import type { SavedVisualization } from './visualization';

export interface DashboardLayoutItem extends LayoutItem {
  i: string; // vizId
}

export interface DashboardVizSlot {
  vizId: string;
  /** Snapshot of the title at time of adding — shown when the viz is deleted. */
  titleSnapshot: string;
}

/** Weekly email digest schedule — re-fetches connected sheets and emails a summary. */
export interface DashboardSchedule {
  enabled: boolean;
  /** 0 = Sunday .. 6 = Saturday, evaluated in UTC. */
  dayOfWeek: number;
  /** ISO timestamp of the last digest send/check, for cron idempotency. */
  lastSentAt?: string;
}

export interface Dashboard {
  _id?: string;
  userId: string;
  title: string;
  /** Unique public share token — only present once published. */
  dashboardId?: string;
  isPublic: boolean;
  slots: DashboardVizSlot[];
  layout: DashboardLayoutItem[];
  schedule?: DashboardSchedule;
  createdAt: string;
  updatedAt: string;
}

/** Dashboard enriched with resolved viz data — used in the builder & share page. */
export interface DashboardWithVizzes extends Dashboard {
  vizzes: (SavedVisualization | null)[];
}
