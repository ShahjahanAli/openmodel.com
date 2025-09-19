import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
  title: string;
  userId: string; // Clerk user ID
  modelId: string; // AI Model ID
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    responseTime?: number; // Response time in seconds
    tokenCount?: number; // Number of tokens in the response
    tokensPerSecond?: number; // Tokens per second calculation
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  modelId: {
    type: String,
    required: true,
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    responseTime: {
      type: Number,
      required: false,
    },
    tokenCount: {
      type: Number,
      required: false,
    },
    tokensPerSecond: {
      type: Number,
      required: false,
    },
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
