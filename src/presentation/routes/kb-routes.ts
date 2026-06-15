import { Router } from 'express';
import {
  createKBEntry,
  getKBEntries,
  getKBById,
  updateKBEntry,
  deleteKBEntry,
} from '../controllers/kb-controller';
import { upload } from '../../core/utils/uploader';
import { validateRequest } from '../../core/middlewares/validation-middleware';
import { createKBSchema, updateKBSchema } from '../validation/kb-validation';
import { authenticate, authorize } from '../../core/middlewares/auth-middleware';
import { UserRole } from '../../core/constants/roles';

const router = Router();

// Public routes
router.get('/', getKBEntries);
router.get('/:id', getKBById);

// Protected company/admin routes (Supports upload of a technical manual via 'file')
router.post(
  '/',
  authenticate,
  authorize(UserRole.COMPANY, UserRole.ADMIN),
  upload.single('file'),
  validateRequest(createKBSchema),
  createKBEntry
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.COMPANY, UserRole.ADMIN),
  upload.single('file'),
  validateRequest(updateKBSchema),
  updateKBEntry
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.COMPANY, UserRole.ADMIN),
  deleteKBEntry
);

export default router;
