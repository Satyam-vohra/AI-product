"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportDiagnosticReportCSV = void 0;
const session_model_1 = __importDefault(require("../../infrastructure/models/session-model"));
const product_model_1 = __importDefault(require("../../infrastructure/models/product-model"));
const app_error_1 = require("../../core/errors/app-error");
const roles_1 = require("../../core/constants/roles");
const exportDiagnosticReportCSV = async (req, res, next) => {
    try {
        const authReq = req;
        const { companyId, role } = authReq.user;
        if (!companyId && role !== roles_1.UserRole.ADMIN) {
            throw new app_error_1.ForbiddenError('Only Company administrators can download technical reports');
        }
        const targetCompanyId = companyId || req.query.companyId;
        // Retrieve company products
        const products = await product_model_1.default.find({ companyId: targetCompanyId });
        const productIds = products.map((p) => p._id);
        const sessions = await session_model_1.default.find({ productId: { $in: productIds } })
            .populate('productId', 'sku name')
            .populate('userId', 'name email')
            .populate('assignedEngineerId', 'name');
        // Generate CSV contents
        let csvContent = 'Session ID,Product SKU,Product Name,User Name,User Email,Status,Assigned Technician,Messages Count,Created Date\n';
        for (const session of sessions) {
            const prod = session.productId;
            const usr = session.userId;
            const eng = session.assignedEngineerId;
            const row = [
                session._id,
                prod ? prod.sku : 'N/A',
                prod ? `"${prod.name.replace(/"/g, '""')}"` : 'N/A',
                usr ? `"${usr.name.replace(/"/g, '""')}"` : 'N/A',
                usr ? usr.email : 'N/A',
                session.resolutionStatus,
                eng ? `"${eng.name.replace(/"/g, '""')}"` : 'Unassigned',
                session.chatHistory.length,
                session.createdAt.toISOString(),
            ].join(',');
            csvContent += row + '\n';
        }
        // Set download headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=mantis_diagnostic_report_${targetCompanyId}.csv`);
        res.status(200).send(csvContent);
    }
    catch (error) {
        next(error);
    }
};
exports.exportDiagnosticReportCSV = exportDiagnosticReportCSV;
