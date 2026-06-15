"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const app_error_1 = require("../errors/app-error");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new app_error_1.UnauthorizedError('Access token is missing or malformed'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        // Attach user payload to request (both standard request using cast and custom request interface)
        req.user = decoded;
        req.user = decoded; // Augmentation fallback
        next();
    }
    catch (error) {
        next(new app_error_1.UnauthorizedError('Invalid or expired access token'));
    }
};
exports.authenticate = authenticate;
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        const user = req.user || req.user;
        if (!user) {
            return next(new app_error_1.UnauthorizedError('User is not authenticated'));
        }
        if (!allowedRoles.includes(user.role)) {
            return next(new app_error_1.ForbiddenError('You do not have permission to access this resource'));
        }
        next();
    };
};
exports.authorize = authorize;
