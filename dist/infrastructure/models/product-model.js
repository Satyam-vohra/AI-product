"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const mongoose_1 = require("mongoose");
const productSchema = new mongoose_1.Schema({
    sku: {
        type: String,
        required: [true, 'SKU code is required'],
        unique: true,
        trim: true,
        uppercase: true,
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
    },
    companyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Owning company is required'],
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    manualUrl: {
        type: String,
    },
    imageUrls: {
        type: [String],
        default: [],
    },
    specifications: {
        type: Map,
        of: String,
        default: {},
    },
}, {
    timestamps: true,
});
// Indexes
// `sku` is already `unique` on the field; avoid duplicate schema.index declaration.
productSchema.index({ companyId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Compound text search index
exports.ProductModel = (0, mongoose_1.model)('Product', productSchema);
exports.default = exports.ProductModel;
