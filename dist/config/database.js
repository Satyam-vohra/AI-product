"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const environment_1 = require("./environment");
const logger_1 = require("../core/utils/logger");
const connectDatabase = async () => {
    try {
        const options = {
            autoIndex: true, // Auto-build indexes in development/test
        };
        mongoose_1.default.connection.on('connected', () => {
            logger_1.logger.info('MongoDB connected successfully.');
        });
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.logger.error(`MongoDB connection error: ${err.message}`);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('MongoDB disconnected.');
        });
        await mongoose_1.default.connect(environment_1.env.MONGO_URI, options);
    }
    catch (error) {
        logger_1.logger.error(`Failed to connect to database: ${error.message}`);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
exports.default = exports.connectDatabase;
