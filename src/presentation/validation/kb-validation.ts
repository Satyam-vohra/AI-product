import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ID format');

export const createKBSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters').optional(),
  tags: z.preprocess((val) => {
    if (typeof val === 'string') return val.split(',').map((t) => t.trim());
    return val;
  }, z.array(z.string())),
  productId: objectIdSchema.optional(),
});

export const updateKBSchema = createKBSchema.partial();
