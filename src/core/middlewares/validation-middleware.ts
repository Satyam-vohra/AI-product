import { Request, Response, NextFunction } from 'express';
import { Schema, ZodError } from 'zod';
import { ValidationError } from '../errors/app-error';

export const validateRequest = (schema: Schema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate req.body (or we can extend to validate query/params if needed)
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(new ValidationError('Request validation failed', formattedErrors));
      }
      next(error);
    }
  };
};
export default validateRequest;
