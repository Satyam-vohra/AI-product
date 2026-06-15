import { Request, Response, NextFunction } from 'express';
export declare const getAdminDashboardStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getCompanyDashboardStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getUserDashboardStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
