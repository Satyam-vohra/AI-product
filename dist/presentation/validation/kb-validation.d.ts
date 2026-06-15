import { z } from 'zod';
export declare const createKBSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
    tags: z.ZodEffects<z.ZodArray<z.ZodString, "many">, string[], unknown>;
    productId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    tags: string[];
    productId?: string | undefined;
    content?: string | undefined;
}, {
    title: string;
    productId?: string | undefined;
    content?: string | undefined;
    tags?: unknown;
}>;
export declare const updateKBSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tags: z.ZodOptional<z.ZodEffects<z.ZodArray<z.ZodString, "many">, string[], unknown>>;
    productId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    productId?: string | undefined;
    title?: string | undefined;
    content?: string | undefined;
    tags?: string[] | undefined;
}, {
    productId?: string | undefined;
    title?: string | undefined;
    content?: string | undefined;
    tags?: unknown;
}>;
