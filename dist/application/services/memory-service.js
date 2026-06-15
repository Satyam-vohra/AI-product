"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryService = void 0;
const memory_model_1 = __importDefault(require("../../infrastructure/models/memory-model"));
class MemoryService {
    static async setMemory(userId, key, value, namespace = 'ai_memory') {
        await memory_model_1.default.findOneAndUpdate({ userId, key, namespace }, { value }, { upsert: true }).exec();
    }
    static async getMemory(userId, key, namespace = 'ai_memory') {
        const doc = await memory_model_1.default.findOne({ userId, key, namespace }).lean();
        return doc ? doc.value : null;
    }
    static async listMemoryForUser(userId, namespace = 'ai_memory') {
        return memory_model_1.default.find({ userId, namespace }).lean();
    }
}
exports.MemoryService = MemoryService;
exports.default = MemoryService;
