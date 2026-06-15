"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductReviews = exports.createReview = exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.getProducts = exports.createProduct = void 0;
const product_model_1 = __importDefault(require("../../infrastructure/models/product-model"));
const review_model_1 = __importDefault(require("../../infrastructure/models/review-model"));
const uploader_1 = require("../../core/utils/uploader");
const app_error_1 = require("../../core/errors/app-error");
const roles_1 = require("../../core/constants/roles");
const createProduct = async (req, res, next) => {
    try {
        const authReq = req;
        const companyId = authReq.user?.companyId;
        if (!companyId && authReq.user?.role !== roles_1.UserRole.ADMIN) {
            throw new app_error_1.ForbiddenError('Only company representatives or administrators can create products');
        }
        const { sku, name, category, description, specifications } = req.body;
        // Check SKU duplicates
        const duplicate = await product_model_1.default.findOne({ sku });
        if (duplicate) {
            throw new app_error_1.BadRequestError(`Product with SKU ${sku} already exists`);
        }
        let manualUrl = undefined;
        const imageUrls = [];
        // Extract files uploaded via Multer
        const files = req.files;
        if (files) {
            if (files['manual'] && files['manual'][0]) {
                const manualFile = files['manual'][0];
                const uploadRes = await (0, uploader_1.uploadToCloudinary)(manualFile.buffer, 'manuals', manualFile.originalname);
                manualUrl = uploadRes.url;
            }
            if (files['images']) {
                for (const imgFile of files['images']) {
                    const uploadRes = await (0, uploader_1.uploadToCloudinary)(imgFile.buffer, 'products', imgFile.originalname);
                    imageUrls.push(uploadRes.url);
                }
            }
        }
        // Parse specifications if stringified JSON
        let parsedSpecs = specifications;
        if (typeof specifications === 'string') {
            try {
                parsedSpecs = JSON.parse(specifications);
            }
            catch {
                parsedSpecs = {};
            }
        }
        const product = await product_model_1.default.create({
            sku,
            name,
            category,
            companyId: companyId || req.body.companyId, // Admin can explicitly set companyId
            description,
            manualUrl,
            imageUrls,
            specifications: parsedSpecs,
        });
        res.status(201).json({
            status: 'success',
            data: { product },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createProduct = createProduct;
const getProducts = async (req, res, next) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;
        const query = {};
        if (category) {
            query.category = String(category);
        }
        if (search) {
            // Use Mongo Text search index
            query.$text = { $search: String(search) };
        }
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skipNum = (pageNum - 1) * limitNum;
        const products = await product_model_1.default.find(query)
            .populate('companyId', 'name domain')
            .skip(skipNum)
            .limit(limitNum);
        const total = await product_model_1.default.countDocuments(query);
        res.status(200).json({
            status: 'success',
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
            data: { products },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await product_model_1.default.findById(id).populate('companyId', 'name domain');
        if (!product) {
            throw new app_error_1.NotFoundError('Product not found');
        }
        // Get average review rating
        const reviewStats = await review_model_1.default.aggregate([
            { $match: { productId: product._id } },
            { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
        ]);
        const stats = reviewStats[0] || { avgRating: 0, totalReviews: 0 };
        res.status(200).json({
            status: 'success',
            data: {
                product,
                ratingAverage: parseFloat(stats.avgRating.toFixed(1)),
                reviewCount: stats.totalReviews,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProductById = getProductById;
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const authReq = req;
        const companyId = authReq.user?.companyId;
        const product = await product_model_1.default.findById(id);
        if (!product) {
            throw new app_error_1.NotFoundError('Product not found');
        }
        // Verify ownership
        if (authReq.user?.role !== roles_1.UserRole.ADMIN && product.companyId.toString() !== companyId) {
            throw new app_error_1.ForbiddenError('You are not authorized to update this product');
        }
        const { name, category, description, specifications } = req.body;
        if (name)
            product.name = name;
        if (category)
            product.category = category;
        if (description)
            product.description = description;
        if (specifications) {
            let parsedSpecs = specifications;
            if (typeof specifications === 'string') {
                try {
                    parsedSpecs = JSON.parse(specifications);
                }
                catch {
                    parsedSpecs = {};
                }
            }
            product.specifications = parsedSpecs;
        }
        // File updates
        const files = req.files;
        if (files) {
            if (files['manual'] && files['manual'][0]) {
                const manualFile = files['manual'][0];
                const uploadRes = await (0, uploader_1.uploadToCloudinary)(manualFile.buffer, 'manuals', manualFile.originalname);
                product.manualUrl = uploadRes.url;
            }
            if (files['images']) {
                const imageUrls = [];
                for (const imgFile of files['images']) {
                    const uploadRes = await (0, uploader_1.uploadToCloudinary)(imgFile.buffer, 'products', imgFile.originalname);
                    imageUrls.push(uploadRes.url);
                }
                product.imageUrls = [...product.imageUrls, ...imageUrls];
            }
        }
        await product.save();
        res.status(200).json({
            status: 'success',
            data: { product },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const authReq = req;
        const companyId = authReq.user?.companyId;
        const product = await product_model_1.default.findById(id);
        if (!product) {
            throw new app_error_1.NotFoundError('Product not found');
        }
        // Verify ownership
        if (authReq.user?.role !== roles_1.UserRole.ADMIN && product.companyId.toString() !== companyId) {
            throw new app_error_1.ForbiddenError('You are not authorized to delete this product');
        }
        await product_model_1.default.findByIdAndDelete(id);
        res.status(200).json({
            status: 'success',
            message: 'Product deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProduct = deleteProduct;
// Review handlers
const createReview = async (req, res, next) => {
    try {
        const { id: productId } = req.params;
        const authReq = req;
        const userId = authReq.user?.userId;
        const { rating, comment } = req.body;
        const product = await product_model_1.default.findById(productId);
        if (!product) {
            throw new app_error_1.NotFoundError('Product not found');
        }
        // Check duplicate reviews
        const existingReview = await review_model_1.default.findOne({ userId, productId });
        if (existingReview) {
            throw new app_error_1.BadRequestError('You have already reviewed this product');
        }
        const review = await review_model_1.default.create({
            userId,
            productId,
            rating,
            comment,
        });
        res.status(201).json({
            status: 'success',
            data: { review },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createReview = createReview;
const getProductReviews = async (req, res, next) => {
    try {
        const { id: productId } = req.params;
        const reviews = await review_model_1.default.find({ productId }).populate('userId', 'name email');
        res.status(200).json({
            status: 'success',
            data: { reviews },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProductReviews = getProductReviews;
