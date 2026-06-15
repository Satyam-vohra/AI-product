"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth-controller");
const validation_middleware_1 = require("../../core/middlewares/validation-middleware");
const auth_validation_1 = require("../validation/auth-validation");
const auth_middleware_1 = require("../../core/middlewares/auth-middleware");
const router = (0, express_1.Router)();
router.post('/register', (0, validation_middleware_1.validateRequest)(auth_validation_1.registerSchema), auth_controller_1.register);
router.post('/login', (0, validation_middleware_1.validateRequest)(auth_validation_1.loginSchema), auth_controller_1.login);
router.post('/refresh', (0, validation_middleware_1.validateRequest)(auth_validation_1.tokenRefreshSchema), auth_controller_1.refresh);
router.post('/logout', (0, validation_middleware_1.validateRequest)(auth_validation_1.tokenRefreshSchema), auth_controller_1.logout);
// Profile is protected
router.get('/profile', auth_middleware_1.authenticate, auth_controller_1.getProfile);
exports.default = router;
