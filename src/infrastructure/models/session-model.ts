import { Schema, model, Document } from 'mongoose';
import { ResolutionStatus } from '../../core/constants/roles';

export interface IChatMessage {
  sender: 'user' | 'ai' | 'agent';
  message: string;
  timestamp: Date;
}

export interface IDiagnosticSession extends Document {
  userId: Schema.Types.ObjectId;
  productId?: Schema.Types.ObjectId;
  chatHistory: IChatMessage[];
  resolutionStatus: ResolutionStatus;
  assignedEngineerId?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    sender: {
      type: String,
      enum: ['user', 'ai', 'agent'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const sessionSchema = new Schema<IDiagnosticSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    chatHistory: {
      type: [chatMessageSchema],
      default: [],
    },
    resolutionStatus: {
      type: String,
      enum: Object.values(ResolutionStatus),
      default: ResolutionStatus.OPEN,
    },
    assignedEngineerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
sessionSchema.index({ userId: 1 });
sessionSchema.index({ productId: 1 });
sessionSchema.index({ resolutionStatus: 1 });
sessionSchema.index({ assignedEngineerId: 1 });

export const DiagnosticSessionModel = model<IDiagnosticSession>('DiagnosticSession', sessionSchema);
export default DiagnosticSessionModel;
