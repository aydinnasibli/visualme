import mongoose, { Schema, Model } from 'mongoose';
import type { UserUsage } from '@/lib/types/visualization';
import { TOKEN_LIMITS } from '@/lib/utils/validation';

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
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    // Token-based usage tracking
    tokensUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    tokensLimit: {
      type: Number,
      default: TOKEN_LIMITS.FREE_TIER_MONTHLY_TOKENS,
      min: 0,
    },
    tokenResetDate: {
      type: Date,
      default: () => {
        // Set to first day of next month
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      },
    },
  },
  {
    timestamps: true,
  }
);

const UserUsageModel: Model<UserUsage> =
  mongoose.models.UserUsage || mongoose.model<UserUsage>('UserUsage', UserUsageSchema);

export default UserUsageModel;
