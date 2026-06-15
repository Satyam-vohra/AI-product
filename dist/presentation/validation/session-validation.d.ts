import { z } from 'zod';
import { ResolutionStatus } from '../../core/constants/roles';
export declare const createSessionSchema: z.ZodObject<{
    productId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    productId: string;
}, {
    productId: string;
}>;
export declare const sendMessageSchema: z.ZodObject<{
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
}, {
    message: string;
}>;
export declare const updateSessionStatusSchema: z.ZodObject<{
    status: z.ZodNativeEnum<typeof ResolutionStatus>;
}, "strip", z.ZodTypeAny, {
    status: ResolutionStatus;
}, {
    status: ResolutionStatus;
}>;
export declare const assignEngineerSchema: z.ZodObject<{
    engineerId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    engineerId: string;
}, {
    engineerId: string;
}>;
