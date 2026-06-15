import { Router } from 'express';
import {
  getAdminDashboardStats,
  getCompanyDashboardStats,
  getUserDashboardStats,
} from '../controllers/dashboard-controller';
import { authenticate, authorize } from '../../core/middlewares/auth-middleware';
import { UserRole } from '../../core/constants/roles';

const router = Router();

// Dashboard routes require authentication
router.use(authenticate);

router.get('/admin', authorize(UserRole.ADMIN), getAdminDashboardStats);
router.get('/company', authorize(UserRole.COMPANY, UserRole.ADMIN), getCompanyDashboardStats);
router.get('/user', authorize(UserRole.USER), getUserDashboardStats);

export default router;
