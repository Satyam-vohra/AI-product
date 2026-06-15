import { Router } from 'express';
import { trackAnalyticsEvent, getAnalyticsSummary } from '../controllers/analytics-controller';
import { validateRequest } from '../../core/middlewares/validation-middleware';
import { analyticsEventSchema } from '../validation/analytics-validation';
import { authenticate } from '../../core/middlewares/auth-middleware';
import { optionalAuthenticate } from '../../core/middlewares/optional-auth-middleware';

const router = Router();

router.post('/events', optionalAuthenticate, validateRequest(analyticsEventSchema), trackAnalyticsEvent);
router.get('/summary', authenticate, getAnalyticsSummary);

export default router;
