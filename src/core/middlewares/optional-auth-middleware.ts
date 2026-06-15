import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticatedRequest } from './auth-middleware';

export const optionalAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const decoded = verifyAccessToken(authHeader.split(' ')[1]);
    (req as AuthenticatedRequest).user = decoded;
    req.user = decoded;
  } catch {
    // Analytics and public search should never fail only because an optional token expired.
  }

  next();
};
