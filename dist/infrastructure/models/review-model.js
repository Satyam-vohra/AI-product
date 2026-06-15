"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = void 0;
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review writer ID is required'],
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Reviewed product ID is required'],
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
        type: String,
        required: [true, 'Comment is required'],
        trim: true,
    },
}, {
    timestamps: true,
});
// Indexes
reviewSchema.index({ productId: 1 });
reviewSchema.index({ userId: 1 });
// Compound unique index to restrict one review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
exports.ReviewModel = (0, mongoose_1.model)('Review', reviewSchema);
exports.default = exports.ReviewModel;
