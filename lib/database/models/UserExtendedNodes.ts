import mongoose, { Schema, Model } from 'mongoose';

export interface IUserExtendedNodes {
  userId: string;
  extendedNodes: string[];
  updatedAt: Date;
  createdAt: Date;
}

const UserExtendedNodesSchema = new Schema<IUserExtendedNodes>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    extendedNodes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient userId lookups
UserExtendedNodesSchema.index({ userId: 1 });

const UserExtendedNodesModel: Model<IUserExtendedNodes> =
  mongoose.models.UserExtendedNodes ||
  mongoose.model<IUserExtendedNodes>('UserExtendedNodes', UserExtendedNodesSchema);

export default UserExtendedNodesModel;
