"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard-controller");
const auth_middleware_1 = require("../../core/middlewares/auth-middleware");
const roles_1 = require("../../core/constants/roles");
const router = (0, express_1.Router)();
// Dashboard routes require authentication
router.use(auth_middleware_1.authenticate);
router.get('/admin', (0, auth_middleware_1.authorize)(roles_1.UserRole.ADMIN), dashboard_controller_1.getAdminDashboardStats);
router.get('/company', (0, auth_middleware_1.authorize)(roles_1.UserRole.COMPANY, roles_1.UserRole.ADMIN), dashboard_controller_1.getCompanyDashboardStats);
router.get('/user', (0, auth_middleware_1.authorize)(roles_1.UserRole.USER), dashboard_controller_1.getUserDashboardStats);
exports.default = router;
