"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenRefreshSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const roles_1 = require("../../core/constants/roles");
// Custom validator for MongoDB ObjectId string
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = zod_1.z.string().regex(objectIdRegex, 'Invalid ID format');
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.nativeEnum(roles_1.UserRole).default(roles_1.UserRole.USER),
    companyId: objectIdSchema.optional(),
    companyName: zod_1.z.string().min(2, 'Company name must be at least 2 characters').optional(),
    domain: zod_1.z.string().min(3, 'Company domain must be at least 3 characters').optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.tokenRefreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
