import { Router } from 'express';
import { acknowledgeNotification, getNotifications } from '../controllers/notification-controller';
import { authenticate } from '../../core/middlewares/auth-middleware';

const router = Router();

router.get('/', authenticate, getNotifications);
router.post('/:id/ack', authenticate, acknowledgeNotification);

export default router;
