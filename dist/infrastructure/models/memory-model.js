"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryModel = void 0;
const mongoose_1 = require("mongoose");
const memorySchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    key: {
        type: String,
        required: true,
    },
    value: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    namespace: {
        type: String,
        default: 'ai_memory',
    },
}, { timestamps: true });
memorySchema.index({ userId: 1, key: 1, namespace: 1 }, { unique: true });
exports.MemoryModel = (0, mongoose_1.model)('Memory', memorySchema);
exports.default = exports.MemoryModel;
