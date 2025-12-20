import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string; // Clerk userId
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;

  // User preferences and data
  extendedNodes: string[];
  savedVisualizations: mongoose.Types.ObjectId[];

  // Subscription and usage
  plan: 'free' | 'pro' | 'enterprise';
  usageCount: number;
  lastResetDate: Date;

  // Metadata
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

    // User data
    extendedNodes: {
      type: [String],
      default: [],
      index: true,
    },
    savedVisualizations: [{
      type: Schema.Types.ObjectId,
      ref: 'Visualization',
    }],

    // Subscription and usage
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

// Indexes for better query performance
UserSchema.index({ clerkId: 1 });
UserSchema.index({ email: 1 }, { sparse: true });
UserSchema.index({ plan: 1, usageCount: 1 });
UserSchema.index({ 'extendedNodes': 1 }, { sparse: true });

// Static method to find or create user
UserSchema.statics.findOrCreate = async function(clerkId: string, userData?: Partial<IUser>) {
  let user = await this.findOne({ clerkId });

  if (!user) {
    user = await this.create({
      clerkId,
      ...userData,
    });
  } else if (userData) {
    // Update user data if provided
    Object.assign(user, userData);
    await user.save();
  }

  return user;
};

// Instance method to check if node is extended
UserSchema.methods.hasExtendedNode = function(nodeId: string): boolean {
  return this.extendedNodes.includes(nodeId);
};

// Instance method to add extended node
UserSchema.methods.addExtendedNode = async function(nodeId: string) {
  if (!this.extendedNodes.includes(nodeId)) {
    this.extendedNodes.push(nodeId);
    await this.save();
  }
  return this;
};

// Instance method to remove extended node
UserSchema.methods.removeExtendedNode = async function(nodeId: string) {
  this.extendedNodes = this.extendedNodes.filter((id: string) => id !== nodeId);
  await this.save();
  return this;
};

// Instance method to clear all extended nodes
UserSchema.methods.clearExtendedNodes = async function() {
  this.extendedNodes = [];
  await this.save();
  return this;
};

const UserModel = (mongoose.models.User || mongoose.model<IUser>('User', UserSchema)) as Model<IUser> & {
  findOrCreate: (clerkId: string, userData?: Partial<IUser>) => Promise<IUser>;
};

export default UserModel;
