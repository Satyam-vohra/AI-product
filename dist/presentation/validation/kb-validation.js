"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateKBSchema = exports.createKBSchema = void 0;
const zod_1 = require("zod");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = zod_1.z.string().regex(objectIdRegex, 'Invalid ID format');
exports.createKBSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    content: zod_1.z.string().min(10, 'Content must be at least 10 characters').optional(),
    tags: zod_1.z.preprocess((val) => {
        if (typeof val === 'string')
            return val.split(',').map((t) => t.trim());
        return val;
    }, zod_1.z.array(zod_1.z.string())),
    productId: objectIdSchema.optional(),
});
exports.updateKBSchema = exports.createKBSchema.partial();
