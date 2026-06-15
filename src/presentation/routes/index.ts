import { Router } from 'express';
import authRoutes from './auth-routes';
import productRoutes from './product-routes';
import kbRoutes from './kb-routes';
import sessionRoutes from './session-routes';
import dashboardRoutes from './dashboard-routes';
import reportRoutes from './report-routes';
import notificationRoutes from './notification-routes';
import landingRoutes from './landing-routes';
import searchRoutes from './search-routes';
import analyticsRoutes from './analytics-routes';

const router = Router();

// API Modules
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/kb', kbRoutes);
router.use('/sessions', sessionRoutes);
router.use('/dashboards', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/landing', landingRoutes);
router.use('/search', searchRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
