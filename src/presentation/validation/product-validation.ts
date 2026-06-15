import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  specifications: z.record(z.string()).optional().default({}),
});

export const updateProductSchema = createProductSchema.partial();

export const createReviewSchema = z.object({
  rating: z.coerce.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().min(5, 'Comment must be at least 5 characters'),
});
