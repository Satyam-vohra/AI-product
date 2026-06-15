"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kb_controller_1 = require("../controllers/kb-controller");
const uploader_1 = require("../../core/utils/uploader");
const validation_middleware_1 = require("../../core/middlewares/validation-middleware");
const kb_validation_1 = require("../validation/kb-validation");
const auth_middleware_1 = require("../../core/middlewares/auth-middleware");
const roles_1 = require("../../core/constants/roles");
const router = (0, express_1.Router)();
// Public routes
router.get('/', kb_controller_1.getKBEntries);
router.get('/:id', kb_controller_1.getKBById);
// Protected company/admin routes (Supports upload of a technical manual via 'file')
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(roles_1.UserRole.COMPANY, roles_1.UserRole.ADMIN), uploader_1.upload.single('file'), (0, validation_middleware_1.validateRequest)(kb_validation_1.createKBSchema), kb_controller_1.createKBEntry);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(roles_1.UserRole.COMPANY, roles_1.UserRole.ADMIN), uploader_1.upload.single('file'), (0, validation_middleware_1.validateRequest)(kb_validation_1.updateKBSchema), kb_controller_1.updateKBEntry);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(roles_1.UserRole.COMPANY, roles_1.UserRole.ADMIN), kb_controller_1.deleteKBEntry);
exports.default = router;
