import { Schema, model, Document } from 'mongoose';

export interface IUserMemory extends Document {
  userId: Schema.Types.ObjectId;
  key: string;
  value: any;
  namespace?: string;
  createdAt: Date;
  updatedAt: Date;
}

const memorySchema = new Schema<IUserMemory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    namespace: {
      type: String,
      default: 'ai_memory',
    },
  },
  { timestamps: true }
);

memorySchema.index({ userId: 1, key: 1, namespace: 1 }, { unique: true });

export const MemoryModel = model<IUserMemory>('Memory', memorySchema);
export default MemoryModel;
