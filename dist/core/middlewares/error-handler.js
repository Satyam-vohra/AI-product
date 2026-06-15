"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const app_error_1 = require("../errors/app-error");
const logger_1 = require("../utils/logger");
const environment_1 = require("../../config/environment");
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors = undefined;
    // Check if it is a custom AppError
    if (err instanceof app_error_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        if (err instanceof app_error_1.ValidationError) {
            errors = err.errors;
        }
    }
    // Log the error
    logger_1.logger.error(`${req.method} ${req.originalUrl} - Status: ${statusCode} - Message: ${err.message} - Stack: ${err.stack}`);
    // Construct JSON response
    res.status(statusCode).json({
        status: 'error',
        message,
        ...(errors && { errors }),
        ...(environment_1.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
exports.default = exports.errorHandler;
