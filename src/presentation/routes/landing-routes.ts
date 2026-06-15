import { Router } from 'express';
import { getLandingData } from '../controllers/landing-controller';

const router = Router();

router.get('/', getLandingData);

export default router;
