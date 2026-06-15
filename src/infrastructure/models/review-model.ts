import { Schema, model, Document } from 'mongoose';

export interface IReview extends Document {
  userId: Schema.Types.ObjectId;
  productId: Schema.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review writer ID is required'],
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Reviewed product ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ productId: 1 });
reviewSchema.index({ userId: 1 });
// Compound unique index to restrict one review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const ReviewModel = model<IReview>('Review', reviewSchema);
export default ReviewModel;
