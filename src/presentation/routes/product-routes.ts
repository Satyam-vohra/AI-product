import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createReview,
  getProductReviews,
} from '../controllers/product-controller';
import { upload } from '../../core/utils/uploader';
import { validateRequest } from '../../core/middlewares/validation-middleware';
import { createProductSchema, updateProductSchema, createReviewSchema } from '../validation/product-validation';
import { authenticate, authorize } from '../../core/middlewares/auth-middleware';
import { UserRole } from '../../core/constants/roles';

const router = Router();

const uploadFields = upload.fields([
  { name: 'manual', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:id/reviews', getProductReviews);

// Protected company/admin routes
router.post(
  '/',
  authenticate,
  authorize(UserRole.COMPANY, UserRole.ADMIN),
  uploadFields,
  validateRequest(createProductSchema),
  createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.COMPANY, UserRole.ADMIN),
  uploadFields,
  validateRequest(updateProductSchema),
  updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.COMPANY, UserRole.ADMIN),
  deleteProduct
);

// Reviews (restricted to standard Users)
router.post(
  '/:id/reviews',
  authenticate,
  authorize(UserRole.USER),
  validateRequest(createReviewSchema),
  createReview
);

export default router;
