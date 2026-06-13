import mongoose, { Schema, Model, Document } from 'mongoose';

interface IUser extends Document {
  clerkId: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;

  savedVisualizations: mongoose.Types.ObjectId[];

  plan: 'free' | 'pro' | 'enterprise';
  usageCount: number;
  lastResetDate: Date;

  notificationPreferences: {
    usageAlerts: boolean;
  };

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
    notificationPreferences: {
      usageAlerts: {
        type: Boolean,
        default: true,
      },
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
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  return user;
};

const UserModel = (mongoose.models.User || mongoose.model<IUser>('User', UserSchema)) as Model<IUser> & {
  findOrCreate: (clerkId: string, userData?: Partial<IUser>) => Promise<IUser>;
};

export default UserModel;
