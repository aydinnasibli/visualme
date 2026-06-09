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

export interface Dashboard {
  _id?: string;
  userId: string;
  title: string;
  /** Unique public share token — only present once published. */
  dashboardId?: string;
  isPublic: boolean;
  slots: DashboardVizSlot[];
  layout: DashboardLayoutItem[];
  createdAt: string;
  updatedAt: string;
}

/** Dashboard enriched with resolved viz data — used in the builder & share page. */
export interface DashboardWithVizzes extends Dashboard {
  vizzes: (SavedVisualization | null)[];
}
