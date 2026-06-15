import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors/app-error';
import { logger } from '../utils/logger';
import { env } from '../../config/environment';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any = undefined;

  // Check if it is a custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    if (err instanceof ValidationError) {
      errors = err.errors;
    }
  }

  // Log the error
  logger.error(`${req.method} ${req.originalUrl} - Status: ${statusCode} - Message: ${err.message} - Stack: ${err.stack}`);

  // Construct JSON response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
export default errorHandler;
