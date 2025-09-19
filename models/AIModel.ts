import mongoose, { Document, Schema } from 'mongoose';

export interface IAIModel extends Document {
  name: string;
  description?: string;
  provider: string; // e.g., 'openai', 'anthropic', 'google', 'custom'
  modelId: string; // e.g., 'gpt-4', 'claude-3', 'gemini-pro'
  apiKey?: string; // For custom models
  endpoint?: string; // For custom models
  serverType?: string; // For Docker/local server types
  userId: string; // Clerk user ID
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AIModelSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  provider: {
    type: String,
    required: true,
    enum: ['openai', 'anthropic', 'google', 'custom'],
  },
  modelId: {
    type: String,
    required: true,
  },
  apiKey: {
    type: String,
    required: false,
  },
  endpoint: {
    type: String,
    required: false,
  },
  serverType: {
    type: String,
    required: false,
  },
  userId: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.AIModel || mongoose.model<IAIModel>('AIModel', AIModelSchema);
