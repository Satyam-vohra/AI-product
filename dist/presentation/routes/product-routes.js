"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product-controller");
const uploader_1 = require("../../core/utils/uploader");
const validation_middleware_1 = require("../../core/middlewares/validation-middleware");
const product_validation_1 = require("../validation/product-validation");
const auth_middleware_1 = require("../../core/middlewares/auth-middleware");
const roles_1 = require("../../core/constants/roles");
const router = (0, express_1.Router)();
const uploadFields = uploader_1.upload.fields([
    { name: 'manual', maxCount: 1 },
    { name: 'images', maxCount: 5 },
]);
// Public routes
router.get('/', product_controller_1.getProducts);
router.get('/:id', product_controller_1.getProductById);
router.get('/:id/reviews', product_controller_1.getProductReviews);
// Protected company/admin routes
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(roles_1.UserRole.COMPANY, roles_1.UserRole.ADMIN), uploadFields, (0, validation_middleware_1.validateRequest)(product_validation_1.createProductSchema), product_controller_1.createProduct);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(roles_1.UserRole.COMPANY, roles_1.UserRole.ADMIN), uploadFields, (0, validation_middleware_1.validateRequest)(product_validation_1.updateProductSchema), product_controller_1.updateProduct);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(roles_1.UserRole.COMPANY, roles_1.UserRole.ADMIN), product_controller_1.deleteProduct);
// Reviews (restricted to standard Users)
router.post('/:id/reviews', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(roles_1.UserRole.USER), (0, validation_middleware_1.validateRequest)(product_validation_1.createReviewSchema), product_controller_1.createReview);
exports.default = router;
