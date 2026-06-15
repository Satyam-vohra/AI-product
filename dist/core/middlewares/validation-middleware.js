"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const app_error_1 = require("../errors/app-error");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            // Validate req.body (or we can extend to validate query/params if needed)
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return next(new app_error_1.ValidationError('Request validation failed', formattedErrors));
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
exports.default = exports.validateRequest;
