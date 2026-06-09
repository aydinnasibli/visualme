import mongoose, { Schema, Model } from 'mongoose';
import type { SavedVisualization } from '@/lib/types/visualization';

const VisualizationSchema = new Schema<SavedVisualization>(
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
    spec: {
      type: Schema.Types.Mixed,
      required: true,
    },
    metadata: {
      generatedAt: {
        type: Date,
        required: true,
      },
      processingTime: Number,
      aiModel: String,
      cost: Number,
      originalInput: {
        type: String,
        required: true,
      },
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    shareId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    history: {
      type: [
        {
          role: { type: String, enum: ['user', 'assistant'], required: true },
          content: { type: String, required: true },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    liveData: {
      url: { type: String },
      interval: { type: Number, default: 0 },
      lastRefreshed: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
VisualizationSchema.index({ userId: 1, createdAt: -1 });
VisualizationSchema.index({ shareId: 1 }, { unique: true, sparse: true });
VisualizationSchema.index({ isPublic: 1, createdAt: -1 });
VisualizationSchema.index({ 'metadata.generatedAt': -1 });

const VisualizationModel: Model<SavedVisualization> =
  mongoose.models.Visualization || mongoose.model<SavedVisualization>('Visualization', VisualizationSchema);

export default VisualizationModel;
