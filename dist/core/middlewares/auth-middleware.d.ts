import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../utils/jwt';
export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorize: (...allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
