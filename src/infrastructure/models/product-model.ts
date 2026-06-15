import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
  sku: string;
  name: string;
  category: string;
  companyId: Schema.Types.ObjectId;
  description: string;
  manualUrl?: string;
  videoUrl?: string;
  imageUrls: string[];
  specifications: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: [true, 'SKU code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Owning company is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    manualUrl: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// `sku` is already `unique` on the field; avoid duplicate schema.index declaration.
productSchema.index({ companyId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Compound text search index

export const ProductModel = model<IProduct>('Product', productSchema);
export default ProductModel;
