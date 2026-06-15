"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewSchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    sku: zod_1.z.string().min(3, 'SKU must be at least 3 characters'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    category: zod_1.z.string().min(2, 'Category is required'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    specifications: zod_1.z.record(zod_1.z.string()).optional().default({}),
});
exports.updateProductSchema = exports.createProductSchema.partial();
exports.createReviewSchema = zod_1.z.object({
    rating: zod_1.z.coerce.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: zod_1.z.string().min(5, 'Comment must be at least 5 characters'),
});
