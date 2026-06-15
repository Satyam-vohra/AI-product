"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const session_controller_1 = require("../controllers/session-controller");
const validation_middleware_1 = require("../../core/middlewares/validation-middleware");
const session_validation_1 = require("../validation/session-validation");
const auth_middleware_1 = require("../../core/middlewares/auth-middleware");
const roles_1 = require("../../core/constants/roles");
const router = (0, express_1.Router)();
// All session routes require authentication
router.use(auth_middleware_1.authenticate);
// User ticket listings
router.get('/user', session_controller_1.getUserSessions);
// Company ticket listings (Company managers & Technicians)
router.get('/company', (0, auth_middleware_1.authorize)(roles_1.UserRole.COMPANY, roles_1.UserRole.SERVICE_ENGINEER), session_controller_1.getCompanySessions);
// Individual ticket creation & details
router.post('/', (0, auth_middleware_1.authorize)(roles_1.UserRole.USER), (0, validation_middleware_1.validateRequest)(session_validation_1.createSessionSchema), session_controller_1.createSession);
router.get('/:id', session_controller_1.getSessionById);
// Message communication (Sending chat queries)
router.post('/:id/messages', (0, auth_middleware_1.authorize)(roles_1.UserRole.USER), (0, validation_middleware_1.validateRequest)(session_validation_1.sendMessageSchema), session_controller_1.sendMessageToSession);
// Technician escalation & state controls
router.post('/:id/assign', (0, auth_middleware_1.authorize)(roles_1.UserRole.COMPANY, roles_1.UserRole.ADMIN), (0, validation_middleware_1.validateRequest)(session_validation_1.assignEngineerSchema), session_controller_1.assignServiceEngineer);
router.put('/:id/status', (0, validation_middleware_1.validateRequest)(session_validation_1.updateSessionStatusSchema), session_controller_1.updateSessionStatus);
exports.default = router;
