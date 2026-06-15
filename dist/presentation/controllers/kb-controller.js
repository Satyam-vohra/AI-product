"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteKBEntry = exports.updateKBEntry = exports.getKBById = exports.getKBEntries = exports.createKBEntry = void 0;
const kb_model_1 = __importDefault(require("../../infrastructure/models/kb-model"));
const embeddings_service_1 = __importDefault(require("../../application/services/embeddings-service"));
const vector_db_service_1 = __importDefault(require("../../application/services/vector-db-service"));
const product_model_1 = __importDefault(require("../../infrastructure/models/product-model"));
const uploader_1 = require("../../core/utils/uploader");
const app_error_1 = require("../../core/errors/app-error");
const roles_1 = require("../../core/constants/roles");
const createKBEntry = async (req, res, next) => {
    try {
        const authReq = req;
        const companyId = authReq.user?.companyId;
        if (!companyId && authReq.user?.role !== roles_1.UserRole.ADMIN) {
            throw new app_error_1.ForbiddenError('Only company representatives or administrators can create knowledge base documents');
        }
        const { title, content, tags, productId } = req.body;
        let fileUrl = undefined;
        let extractedContent = content;
        // Check if file is uploaded
        if (req.file) {
            const uploadRes = await (0, uploader_1.uploadToCloudinary)(req.file.buffer, 'kb-documents', req.file.originalname);
            fileUrl = uploadRes.url;
            // Automatically ingest text content from plain text file uploads if content body is blank
            if (req.file.mimetype === 'text/plain' && !extractedContent) {
                extractedContent = req.file.buffer.toString('utf-8');
            }
        }
        if (!extractedContent && !fileUrl) {
            throw new app_error_1.BadRequestError('Either content text or an uploaded document must be provided');
        }
        // Default placeholder if file is document pdf but no manual content
        if (!extractedContent) {
            extractedContent = `Technical Document attachment index at ${fileUrl}`;
        }
        // Parse tags if stringified array
        let parsedTags = tags;
        if (typeof tags === 'string') {
            try {
                parsedTags = JSON.parse(tags);
            }
            catch {
                parsedTags = tags.split(',').map((t) => t.trim());
            }
        }
        // Verify Product belongs to the company if linked
        if (productId) {
            const product = await product_model_1.default.findById(productId);
            if (!product) {
                throw new app_error_1.NotFoundError('Linked product not found');
            }
            if (authReq.user?.role !== roles_1.UserRole.ADMIN && product.companyId.toString() !== companyId) {
                throw new app_error_1.ForbiddenError('Linked product must belong to your company');
            }
        }
        const kbEntry = await kb_model_1.default.create({
            title,
            content: extractedContent,
            tags: parsedTags || [],
            productId: productId || undefined,
            companyId: companyId || req.body.companyId, // Admin override
            fileUrl,
        });
        // Compute embeddings asynchronously and upsert to vector index
        try {
            const v = embeddings_service_1.default.embedText(kbEntry.content || kbEntry.title || '');
            await vector_db_service_1.default.upsertRecord(String(kbEntry._id), kbEntry.title, v, { productId: kbEntry.productId, fileUrl: fileUrl });
        }
        catch (err) {
            // non-fatal
        }
        res.status(201).json({
            status: 'success',
            data: { kbEntry },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createKBEntry = createKBEntry;
const getKBEntries = async (req, res, next) => {
    try {
        const { productId, tags, search, page = 1, limit = 10 } = req.query;
        const query = {};
        if (productId) {
            query.productId = String(productId);
        }
        if (tags) {
            const tagList = String(tags).split(',').map((t) => t.trim());
            query.tags = { $in: tagList };
        }
        if (search) {
            query.$text = { $search: String(search) };
        }
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skipNum = (pageNum - 1) * limitNum;
        const kbEntries = await kb_model_1.default.find(query)
            .populate('productId', 'sku name')
            .populate('companyId', 'name domain')
            .skip(skipNum)
            .limit(limitNum);
        const total = await kb_model_1.default.countDocuments(query);
        res.status(200).json({
            status: 'success',
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
            data: { kbEntries },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getKBEntries = getKBEntries;
const getKBById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const kbEntry = await kb_model_1.default.findById(id)
            .populate('productId', 'sku name')
            .populate('companyId', 'name domain');
        if (!kbEntry) {
            throw new app_error_1.NotFoundError('Knowledge base entry not found');
        }
        res.status(200).json({
            status: 'success',
            data: { kbEntry },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getKBById = getKBById;
const updateKBEntry = async (req, res, next) => {
    try {
        const { id } = req.params;
        const authReq = req;
        const companyId = authReq.user?.companyId;
        const kbEntry = await kb_model_1.default.findById(id);
        if (!kbEntry) {
            throw new app_error_1.NotFoundError('Knowledge base entry not found');
        }
        // Verify ownership
        if (authReq.user?.role !== roles_1.UserRole.ADMIN && kbEntry.companyId.toString() !== companyId) {
            throw new app_error_1.ForbiddenError('You are not authorized to update this document');
        }
        const { title, content, tags, productId } = req.body;
        if (title)
            kbEntry.title = title;
        if (content)
            kbEntry.content = content;
        if (tags) {
            let parsedTags = tags;
            if (typeof tags === 'string') {
                try {
                    parsedTags = JSON.parse(tags);
                }
                catch {
                    parsedTags = tags.split(',').map((t) => t.trim());
                }
            }
            kbEntry.tags = parsedTags;
        }
        if (productId) {
            const product = await product_model_1.default.findById(productId);
            if (!product) {
                throw new app_error_1.NotFoundError('Linked product not found');
            }
            if (authReq.user?.role !== roles_1.UserRole.ADMIN && product.companyId.toString() !== companyId) {
                throw new app_error_1.ForbiddenError('Linked product must belong to your company');
            }
            kbEntry.productId = productId;
        }
        // Handle new file attachments
        if (req.file) {
            const uploadRes = await (0, uploader_1.uploadToCloudinary)(req.file.buffer, 'kb-documents', req.file.originalname);
            kbEntry.fileUrl = uploadRes.url;
            if (req.file.mimetype === 'text/plain' && !content) {
                kbEntry.content = req.file.buffer.toString('utf-8');
            }
        }
        await kbEntry.save();
        // Recompute embeddings if content/title changed
        try {
            const v = embeddings_service_1.default.embedText(kbEntry.content || kbEntry.title || '');
            await vector_db_service_1.default.upsertRecord(String(kbEntry._id), kbEntry.title, v, { productId: kbEntry.productId, fileUrl: kbEntry.fileUrl });
        }
        catch (err) {
            // non-fatal
        }
        res.status(200).json({
            status: 'success',
            data: { kbEntry },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateKBEntry = updateKBEntry;
const deleteKBEntry = async (req, res, next) => {
    try {
        const { id } = req.params;
        const authReq = req;
        const companyId = authReq.user?.companyId;
        const kbEntry = await kb_model_1.default.findById(id);
        if (!kbEntry) {
            throw new app_error_1.NotFoundError('Knowledge base entry not found');
        }
        // Verify ownership
        if (authReq.user?.role !== roles_1.UserRole.ADMIN && kbEntry.companyId.toString() !== companyId) {
            throw new app_error_1.ForbiddenError('You are not authorized to delete this document');
        }
        await kb_model_1.default.findByIdAndDelete(id);
        res.status(200).json({
            status: 'success',
            message: 'Knowledge base entry deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteKBEntry = deleteKBEntry;
