"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report-controller");
const auth_middleware_1 = require("../../core/middlewares/auth-middleware");
const roles_1 = require("../../core/constants/roles");
const router = (0, express_1.Router)();
router.get('/export', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(roles_1.UserRole.COMPANY, roles_1.UserRole.ADMIN), report_controller_1.exportDiagnosticReportCSV);
exports.default = router;
