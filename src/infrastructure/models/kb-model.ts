import { Schema, model, Document } from 'mongoose';

export interface IKnowledgeBase extends Document {
  title: string;
  content: string;
  tags: string[];
  embeddings?: number[];
  productId?: Schema.Types.ObjectId;
  companyId: Schema.Types.ObjectId;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const kbSchema = new Schema<IKnowledgeBase>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    tags: {
      type: [String],
      default: [],
    },
    // Pre-computed semantic embedding vector (optional)
    embeddings: {
      type: [Number],
      default: undefined,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company assignment is required'],
    },
    fileUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
kbSchema.index({ companyId: 1 });
kbSchema.index({ productId: 1 });
kbSchema.index({ tags: 1 });
kbSchema.index({ title: 'text', content: 'text' }); // Compound text search index

export const KnowledgeBaseModel = model<IKnowledgeBase>('KnowledgeBase', kbSchema);
export default KnowledgeBaseModel;
