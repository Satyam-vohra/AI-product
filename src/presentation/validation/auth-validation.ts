import { z } from 'zod';
import { UserRole } from '../../core/constants/roles';

// Custom validator for MongoDB ObjectId string
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ID format');

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  companyId: objectIdSchema.optional(),
  companyName: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  domain: z.string().min(3, 'Company domain must be at least 3 characters').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const tokenRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TokenRefreshInput = z.infer<typeof tokenRefreshSchema>;
