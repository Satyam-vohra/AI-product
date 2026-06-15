import { z } from 'zod';
import { ResolutionStatus } from '../../core/constants/roles';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ID format');

export const createSessionSchema = z.object({
  productId: objectIdSchema.optional(),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  contextPart: z.string().trim().max(120).optional(),
});

export const updateSessionStatusSchema = z.object({
  status: z.nativeEnum(ResolutionStatus),
});

export const assignEngineerSchema = z.object({
  engineerId: objectIdSchema,
});
