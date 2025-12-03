import mongoose, { Schema, Model } from 'mongoose';
import type { UserUsage } from '@/lib/types/visualization';

const UserUsageSchema = new Schema<UserUsage>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    visualizationsCreated: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastResetDate: {
      type: Date,
      default: Date.now,
    },
    tier: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient lookups
UserUsageSchema.index({ userId: 1 });
UserUsageSchema.index({ tier: 1 });

const UserUsageModel: Model<UserUsage> =
  mongoose.models.UserUsage || mongoose.model<UserUsage>('UserUsage', UserUsageSchema);

export default UserUsageModel;
