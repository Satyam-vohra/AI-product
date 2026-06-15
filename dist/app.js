"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const routes_1 = __importDefault(require("./presentation/routes"));
const error_handler_1 = require("./core/middlewares/error-handler");
const app_error_1 = require("./core/errors/app-error");
const app = (0, express_1.default)();
// Set security HTTP headers
app.use((0, helmet_1.default)());
// Enable CORS
app.use((0, cors_1.default)());
// Body parser, reading data from body into req.body
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Limit requests from same API
const limiter = (0, express_rate_limit_1.default)({
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests from this IP, please try again in 15 minutes!',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);
// API Versioning namespace
app.use('/api/v1', routes_1.default);
// Handle unhandled routes
app.all('*', (req, res, next) => {
    next(new app_error_1.NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});
// Global Error handling middleware
app.use(error_handler_1.errorHandler);
exports.default = app;
