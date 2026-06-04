import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;

  extendedNodes: string[];
  savedVisualizations: mongoose.Types.ObjectId[];

  plan: 'free' | 'pro' | 'enterprise';
  usageCount: number;
  lastResetDate: Date;

  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      sparse: true,
    },
    username: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    firstName: String,
    lastName: String,
    imageUrl: String,

    extendedNodes: {
      type: [String],
      default: [],
    },
    savedVisualizations: [{
      type: Schema.Types.ObjectId,
      ref: 'Visualization',
    }],

    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastResetDate: {
      type: Date,
      default: Date.now,
    },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ plan: 1, usageCount: 1 });

// Atomic upsert: prevents duplicate documents under concurrent requests
UserSchema.statics.findOrCreate = async function(clerkId: string, userData?: Partial<IUser>) {
  const update: Record<string, unknown> = { $setOnInsert: { clerkId } };

  if (userData) {
    update.$set = userData;
  }

  const user = await this.findOneAndUpdate(
    { clerkId },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return user;
};

UserSchema.methods.hasExtendedNode = function(nodeId: string): boolean {
  return this.extendedNodes.includes(nodeId);
};

UserSchema.methods.addExtendedNode = async function(nodeId: string) {
  if (!this.extendedNodes.includes(nodeId)) {
    this.extendedNodes.push(nodeId);
    await this.save();
  }
  return this;
};

UserSchema.methods.removeExtendedNode = async function(nodeId: string) {
  this.extendedNodes = this.extendedNodes.filter((id: string) => id !== nodeId);
  await this.save();
  return this;
};

UserSchema.methods.clearExtendedNodes = async function() {
  this.extendedNodes = [];
  await this.save();
  return this;
};

const UserModel = (mongoose.models.User || mongoose.model<IUser>('User', UserSchema)) as Model<IUser> & {
  findOrCreate: (clerkId: string, userData?: Partial<IUser>) => Promise<IUser>;
};

export default UserModel;
