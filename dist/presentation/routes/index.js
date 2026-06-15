"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth-routes"));
const product_routes_1 = __importDefault(require("./product-routes"));
const kb_routes_1 = __importDefault(require("./kb-routes"));
const session_routes_1 = __importDefault(require("./session-routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard-routes"));
const report_routes_1 = __importDefault(require("./report-routes"));
const notification_routes_1 = __importDefault(require("./notification-routes"));
const landing_routes_1 = __importDefault(require("./landing-routes"));
const router = (0, express_1.Router)();
// API Modules
router.use('/auth', auth_routes_1.default);
router.use('/products', product_routes_1.default);
router.use('/kb', kb_routes_1.default);
router.use('/sessions', session_routes_1.default);
router.use('/dashboards', dashboard_routes_1.default);
router.use('/reports', report_routes_1.default);
router.use('/notifications', notification_routes_1.default);
router.use('/landing', landing_routes_1.default);
exports.default = router;
