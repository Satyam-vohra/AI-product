import { Request, Response, NextFunction } from 'express';
export declare const createKBEntry: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getKBEntries: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getKBById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateKBEntry: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteKBEntry: (req: Request, res: Response, next: NextFunction) => Promise<void>;
