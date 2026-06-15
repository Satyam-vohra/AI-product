import { Router } from 'express';
import { exportDiagnosticReportCSV } from '../controllers/report-controller';
import { authenticate, authorize } from '../../core/middlewares/auth-middleware';
import { UserRole } from '../../core/constants/roles';

const router = Router();

router.get(
  '/export',
  authenticate,
  authorize(UserRole.COMPANY, UserRole.ADMIN),
  exportDiagnosticReportCSV
);

export default router;
