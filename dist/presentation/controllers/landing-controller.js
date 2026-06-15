"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLandingData = void 0;
const product_model_1 = __importDefault(require("../../infrastructure/models/product-model"));
const kb_model_1 = __importDefault(require("../../infrastructure/models/kb-model"));
const company_model_1 = __importDefault(require("../../infrastructure/models/company-model"));
const getLandingData = async (req, res, next) => {
    try {
        const [productCount, kbCount, companyCount] = await Promise.all([
            product_model_1.default.countDocuments(),
            kb_model_1.default.countDocuments(),
            company_model_1.default.countDocuments(),
        ]);
        // Retrieve a few popular tags
        const popularTags = await kb_model_1.default.distinct('tags');
        res.status(200).json({
            status: 'success',
            data: {
                platformName: 'Mantis AI',
                tagline: 'Intelligent Product Support & Diagnostic Platform',
                stats: {
                    companiesActive: companyCount,
                    productsMonitored: productCount,
                    troubleshootingGuides: kbCount,
                },
                features: [
                    {
                        title: 'Automated AI Diagnostics',
                        description: 'Instantly resolve device anomalies via cognitive retrieval loops over engineering manuals.',
                    },
                    {
                        title: 'RAG Knowledge Repositories',
                        description: 'Centralized manual ingestion supporting structured plain text indexing and instant document search.',
                    },
                    {
                        title: 'Technician Escalation Engine',
                        description: 'Seamlessly shift complex diagnostic chats to live company Service Engineers under strict RBAC.',
                    },
                ],
                popularTags: popularTags.slice(0, 8),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getLandingData = getLandingData;
