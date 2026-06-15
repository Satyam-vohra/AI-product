"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignEngineerSchema = exports.updateSessionStatusSchema = exports.sendMessageSchema = exports.createSessionSchema = void 0;
const zod_1 = require("zod");
const roles_1 = require("../../core/constants/roles");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = zod_1.z.string().regex(objectIdRegex, 'Invalid ID format');
exports.createSessionSchema = zod_1.z.object({
    productId: objectIdSchema,
});
exports.sendMessageSchema = zod_1.z.object({
    message: zod_1.z.string().min(1, 'Message cannot be empty'),
});
exports.updateSessionStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(roles_1.ResolutionStatus),
});
exports.assignEngineerSchema = zod_1.z.object({
    engineerId: objectIdSchema,
});
