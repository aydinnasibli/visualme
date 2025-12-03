import mongoose, { Schema, Model } from 'mongoose';
import type { SavedVisualization, VisualizationType } from '@/lib/types/visualization';

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
    type: {
      type: String,
      required: true,
      enum: [
        'network_graph',
        'mind_map',
        'tree_diagram',
        'force_directed_graph',
        'timeline',
        'gantt_chart',
        'animated_timeline',
        'flowchart',
        'sankey_diagram',
        'swimlane_diagram',
        'line_chart',
        'bar_chart',
        'scatter_plot',
        'heatmap',
        'radar_chart',
        'pie_chart',
        'comparison_table',
        'parallel_coordinates',
        'word_cloud',
        'syntax_diagram',
      ] as VisualizationType[],
    },
    data: {
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
