import { Router } from 'express';
import {
  createSession,
  getSessionById,
  sendMessageToSession,
  assignServiceEngineer,
  updateSessionStatus,
  getUserSessions,
  getCompanySessions,
} from '../controllers/session-controller';
import { validateRequest } from '../../core/middlewares/validation-middleware';
import {
  createSessionSchema,
  sendMessageSchema,
  assignEngineerSchema,
  updateSessionStatusSchema,
} from '../validation/session-validation';
import { authenticate, authorize } from '../../core/middlewares/auth-middleware';
import { UserRole } from '../../core/constants/roles';

const router = Router();

// All session routes require authentication
router.use(authenticate);

// User ticket listings
router.get('/user', getUserSessions);

// Company ticket listings (Company managers & Technicians)
router.get('/company', authorize(UserRole.COMPANY, UserRole.SERVICE_ENGINEER), getCompanySessions);

// Individual ticket creation & details
router.post('/', validateRequest(createSessionSchema), createSession);
router.get('/:id', getSessionById);

// Message communication (Sending chat queries)
router.post('/:id/messages', validateRequest(sendMessageSchema), sendMessageToSession);

// Technician escalation & state controls
router.post('/:id/assign', authorize(UserRole.COMPANY, UserRole.ADMIN), validateRequest(assignEngineerSchema), assignServiceEngineer);
router.put('/:id/status', validateRequest(updateSessionStatusSchema), updateSessionStatus);

export default router;
