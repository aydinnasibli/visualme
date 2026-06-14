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
    schedule: {
      enabled: { type: Boolean, default: false },
      dayOfWeek: { type: Number },
      lastSentAt: { type: String },
    },
    // Auto-persisted "session" docs (created on every generation) are
    // ephemeral until the user explicitly saves — `isSaved: false` plus
    // `sessionExpiresAt` marks them for TTL cleanup. Pre-existing docs and
    // explicitly-saved docs have isSaved=true (or missing, treated as saved)
    // and no sessionExpiresAt, so they're never touched by the TTL index.
    // No `default` here on purpose: a schema default would apply to hydrated
    // (non-lean) legacy docs missing this field, making `isSaved === false`
    // checks misidentify pre-existing saved visualizations as ephemeral sessions.
    isSaved: {
      type: Boolean,
    },
    sessionExpiresAt: {
      type: Date,
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
// TTL: documents are removed once sessionExpiresAt is in the past. Docs
// without this field (saved/legacy/live) are never expired.
VisualizationSchema.index({ sessionExpiresAt: 1 }, { expireAfterSeconds: 0 });

const VisualizationModel: Model<SavedVisualization> =
  mongoose.models.Visualization || mongoose.model<SavedVisualization>('Visualization', VisualizationSchema);

export default VisualizationModel;
