import { Request, Response, NextFunction } from 'express';
export declare const createSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getSessionById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const sendMessageToSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const assignServiceEngineer: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateSessionStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getUserSessions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getCompanySessions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
