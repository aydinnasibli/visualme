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
  },
  { timestamps: true }
);

DashboardSchema.index({ userId: 1, createdAt: -1 });
DashboardSchema.index({ dashboardId: 1 }, { unique: true, sparse: true });

const DashboardModel: Model<Dashboard> =
  mongoose.models.Dashboard || mongoose.model<Dashboard>('Dashboard', DashboardSchema);

export default DashboardModel;
