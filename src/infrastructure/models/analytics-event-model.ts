import { Schema, model, Document } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  name: string;
  userId?: Schema.Types.ObjectId;
  sessionId?: string;
  path?: string;
  properties: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: 120,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sessionId: {
      type: String,
      trim: true,
    },
    path: {
      type: String,
      trim: true,
    },
    properties: {
      type: Schema.Types.Mixed,
      default: {},
    },
    userAgent: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

analyticsEventSchema.index({ name: 1, createdAt: -1 });
analyticsEventSchema.index({ userId: 1, createdAt: -1 });
analyticsEventSchema.index({ path: 1, createdAt: -1 });

export const AnalyticsEventModel = model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema);
export default AnalyticsEventModel;
