import mongoose, { Schema, Model } from 'mongoose';
import type { Dashboard } from '@/lib/types/dashboard';

const DashboardSchema = new Schema<Dashboard>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    dashboardId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    slots: {
      type: [
        {
          vizId: { type: String, required: true },
          titleSnapshot: { type: String, required: true },
        },
      ],
      default: [],
    },
    layout: {
      type: [
        {
          i: { type: String, required: true },
          x: { type: Number, required: true },
          y: { type: Number, required: true },
          w: { type: Number, required: true },
          h: { type: Number, required: true },
          minW: Number,
          maxW: Number,
          minH: Number,
          maxH: Number,
        },
      ],
      default: [],
    },
    // Weekly email digest: re-fetches connected sheets for this dashboard's
    // charts and emails a summary on `dayOfWeek` (UTC).
    schedule: {
      enabled: { type: Boolean, default: false },
      dayOfWeek: { type: Number, min: 0, max: 6, default: 1 }, // Monday
      lastSentAt: Date,
    },
  },
  { timestamps: true }
);

DashboardSchema.index({ userId: 1, createdAt: -1 });
DashboardSchema.index({ dashboardId: 1 }, { unique: true, sparse: true });
DashboardSchema.index({ 'schedule.enabled': 1, 'schedule.dayOfWeek': 1 });

const DashboardModel: Model<Dashboard> =
  mongoose.models.Dashboard || mongoose.model<Dashboard>('Dashboard', DashboardSchema);

export default DashboardModel;
