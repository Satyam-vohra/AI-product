import { Router } from 'express';
import { register, login, refresh, logout, getProfile } from '../controllers/auth-controller';
import { validateRequest } from '../../core/middlewares/validation-middleware';
import { registerSchema, loginSchema, tokenRefreshSchema } from '../validation/auth-validation';
import { authenticate } from '../../core/middlewares/auth-middleware';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', validateRequest(tokenRefreshSchema), refresh);
router.post('/logout', validateRequest(tokenRefreshSchema), logout);

// Profile is protected
router.get('/profile', authenticate, getProfile);

export default router;
