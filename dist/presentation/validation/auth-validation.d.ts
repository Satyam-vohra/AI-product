import { z } from 'zod';
import { UserRole } from '../../core/constants/roles';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodNativeEnum<typeof UserRole>>;
    companyId: z.ZodOptional<z.ZodString>;
    companyName: z.ZodOptional<z.ZodString>;
    domain: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    companyId?: string | undefined;
    domain?: string | undefined;
    companyName?: string | undefined;
}, {
    name: string;
    email: string;
    password: string;
    role?: UserRole | undefined;
    companyId?: string | undefined;
    domain?: string | undefined;
    companyName?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const tokenRefreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TokenRefreshInput = z.infer<typeof tokenRefreshSchema>;
