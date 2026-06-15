import { Router } from 'express';
import { proxyFile } from '../controllers/proxy-controller';

const router = Router();

router.get('/file', proxyFile);

export default router;
