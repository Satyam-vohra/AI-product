"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBaseModel = void 0;
const mongoose_1 = require("mongoose");
const kbSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
    },
    tags: {
        type: [String],
        default: [],
    },
    // Pre-computed semantic embedding vector (optional)
    embeddings: {
        type: [Number],
        default: undefined,
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
    },
    companyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company assignment is required'],
    },
    fileUrl: {
        type: String,
    },
}, {
    timestamps: true,
});
// Indexes
kbSchema.index({ companyId: 1 });
kbSchema.index({ productId: 1 });
kbSchema.index({ tags: 1 });
kbSchema.index({ title: 'text', content: 'text' }); // Compound text search index
exports.KnowledgeBaseModel = (0, mongoose_1.model)('KnowledgeBase', kbSchema);
exports.default = exports.KnowledgeBaseModel;
