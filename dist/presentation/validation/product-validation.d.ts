import { z } from 'zod';
export declare const createProductSchema: z.ZodObject<{
    sku: z.ZodString;
    name: z.ZodString;
    category: z.ZodString;
    description: z.ZodString;
    specifications: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    sku: string;
    category: string;
    specifications: Record<string, string>;
}, {
    name: string;
    description: string;
    sku: string;
    category: string;
    specifications?: Record<string, string> | undefined;
}>;
export declare const updateProductSchema: z.ZodObject<{
    sku: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    specifications: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    sku?: string | undefined;
    category?: string | undefined;
    specifications?: Record<string, string> | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    sku?: string | undefined;
    category?: string | undefined;
    specifications?: Record<string, string> | undefined;
}>;
export declare const createReviewSchema: z.ZodObject<{
    rating: z.ZodNumber;
    comment: z.ZodString;
}, "strip", z.ZodTypeAny, {
    comment: string;
    rating: number;
}, {
    comment: string;
    rating: number;
}>;
