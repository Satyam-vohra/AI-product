import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';

// Custom request interface that guarantees the presence of the user property
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Access token is missing or malformed'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    // Attach user payload to request (both standard request using cast and custom request interface)
    (req as AuthenticatedRequest).user = decoded;
    req.user = decoded; // Augmentation fallback
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired access token'));
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user || req.user;

    if (!user) {
      return next(new UnauthorizedError('User is not authenticated'));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }

    next();
  };
};
