"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDashboardStats = exports.getCompanyDashboardStats = exports.getAdminDashboardStats = void 0;
const user_model_1 = __importDefault(require("../../infrastructure/models/user-model"));
const company_model_1 = __importDefault(require("../../infrastructure/models/company-model"));
const product_model_1 = __importDefault(require("../../infrastructure/models/product-model"));
const session_model_1 = __importDefault(require("../../infrastructure/models/session-model"));
const kb_model_1 = __importDefault(require("../../infrastructure/models/kb-model"));
const review_model_1 = __importDefault(require("../../infrastructure/models/review-model"));
const app_error_1 = require("../../core/errors/app-error");
const roles_1 = require("../../core/constants/roles");
const getAdminDashboardStats = async (req, res, next) => {
    try {
        const authReq = req;
        if (authReq.user?.role !== roles_1.UserRole.ADMIN) {
            throw new app_error_1.ForbiddenError('Only Administrators can access global platform analytics');
        }
        const [totalUsers, totalCompanies, totalProducts, totalKBEntries, roleDistribution, sessionStatusCounts,] = await Promise.all([
            user_model_1.default.countDocuments(),
            company_model_1.default.countDocuments(),
            product_model_1.default.countDocuments(),
            kb_model_1.default.countDocuments(),
            user_model_1.default.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]),
            session_model_1.default.aggregate([
                { $group: { _id: '$resolutionStatus', count: { $sum: 1 } } }
            ]),
        ]);
        const formattedRoles = roleDistribution.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
        const formattedSessions = sessionStatusCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
        // Calculate resolution rate
        const totalSessions = await session_model_1.default.countDocuments();
        const resolvedSessions = formattedSessions[roles_1.ResolutionStatus.RESOLVED] || 0;
        const resolutionRate = totalSessions > 0 ? parseFloat(((resolvedSessions / totalSessions) * 100).toFixed(1)) : 100;
        res.status(200).json({
            status: 'success',
            data: {
                counters: {
                    users: totalUsers,
                    companies: totalCompanies,
                    products: totalProducts,
                    knowledgeDocuments: totalKBEntries,
                    diagnosticSessions: totalSessions,
                },
                distributions: {
                    roles: formattedRoles,
                    sessionStatus: formattedSessions,
                },
                metrics: {
                    resolutionRatePercent: resolutionRate,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminDashboardStats = getAdminDashboardStats;
const getCompanyDashboardStats = async (req, res, next) => {
    try {
        const authReq = req;
        const companyId = authReq.user?.companyId;
        if (!companyId && authReq.user?.role !== roles_1.UserRole.ADMIN) {
            throw new app_error_1.ForbiddenError('Only Company managers can access tenant analytics');
        }
        const targetCompanyId = companyId || req.query.companyId; // Admin can specify in query
        // Find company products
        const products = await product_model_1.default.find({ companyId: targetCompanyId });
        const productIds = products.map((p) => p._id);
        const [totalProducts, technicianCount, sessions, averageRatingStats,] = await Promise.all([
            product_model_1.default.countDocuments({ companyId: targetCompanyId }),
            user_model_1.default.countDocuments({ companyId: targetCompanyId, role: roles_1.UserRole.SERVICE_ENGINEER }),
            session_model_1.default.aggregate([
                { $match: { productId: { $in: productIds } } },
                { $group: { _id: '$resolutionStatus', count: { $sum: 1 } } }
            ]),
            review_model_1.default.aggregate([
                { $match: { productId: { $in: productIds } } },
                { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
            ]),
        ]);
        const formattedSessions = sessions.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
        const ratingStats = averageRatingStats[0] || { avgRating: 0, totalReviews: 0 };
        res.status(200).json({
            status: 'success',
            data: {
                productsCount: totalProducts,
                engineersCount: technicianCount,
                reviewsCount: ratingStats.totalReviews,
                averageRating: parseFloat(ratingStats.avgRating.toFixed(1)),
                sessionsStatusDistribution: formattedSessions,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCompanyDashboardStats = getCompanyDashboardStats;
const getUserDashboardStats = async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        const [totalSessions, resolvedSessions, totalReviews, recentSessions,] = await Promise.all([
            session_model_1.default.countDocuments({ userId }),
            session_model_1.default.countDocuments({ userId, resolutionStatus: roles_1.ResolutionStatus.RESOLVED }),
            review_model_1.default.countDocuments({ userId }),
            session_model_1.default.find({ userId })
                .populate('productId', 'name category')
                .sort({ updatedAt: -1 })
                .limit(5),
        ]);
        res.status(200).json({
            status: 'success',
            data: {
                metrics: {
                    totalDiagnosticSessions: totalSessions,
                    resolvedSessions,
                    openSessions: totalSessions - resolvedSessions,
                    reviewsWritten: totalReviews,
                },
                recentDiagnosticSessions: recentSessions,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserDashboardStats = getUserDashboardStats;
