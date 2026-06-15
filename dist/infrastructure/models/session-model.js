"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticSessionModel = void 0;
const mongoose_1 = require("mongoose");
const roles_1 = require("../../core/constants/roles");
const chatMessageSchema = new mongoose_1.Schema({
    sender: {
        type: String,
        enum: ['user', 'ai', 'agent'],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });
const sessionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
    },
    chatHistory: {
        type: [chatMessageSchema],
        default: [],
    },
    resolutionStatus: {
        type: String,
        enum: Object.values(roles_1.ResolutionStatus),
        default: roles_1.ResolutionStatus.OPEN,
    },
    assignedEngineerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});
// Indexes
sessionSchema.index({ userId: 1 });
sessionSchema.index({ productId: 1 });
sessionSchema.index({ resolutionStatus: 1 });
sessionSchema.index({ assignedEngineerId: 1 });
exports.DiagnosticSessionModel = (0, mongoose_1.model)('DiagnosticSession', sessionSchema);
exports.default = exports.DiagnosticSessionModel;
