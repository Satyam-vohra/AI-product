"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const environment_1 = require("./config/environment");
const database_1 = require("./config/database");
const logger_1 = require("./core/utils/logger");
const vector_db_service_1 = __importDefault(require("./application/services/vector-db-service"));
// Handle uncaught exceptions globally to prevent silent failures
process.on('uncaughtException', (err) => {
    logger_1.logger.error(`UNCAUGHT EXCEPTION! Shutting down... Reason: ${err.message}`);
    process.exit(1);
});
let server;
const startServer = async () => {
    // Connect to Database first
    await (0, database_1.connectDatabase)();
    // Warm up in-memory vector index from knowledge base embeddings
    try {
        await vector_db_service_1.default.loadIndex();
        logger_1.logger.info('VectorDB: Loaded KB embeddings into memory index');
    }
    catch (err) {
        logger_1.logger.warn('VectorDB: Failed to warm index at startup');
    }
    const PORT = environment_1.env.PORT || 5000;
    server = app_1.default.listen(PORT, () => {
        logger_1.logger.info(`=================================`);
        logger_1.logger.info(`  Mantis AI Backend Active      `);
        logger_1.logger.info(`  Environment: ${environment_1.env.NODE_ENV}  `);
        logger_1.logger.info(`  Port: ${PORT}                  `);
        logger_1.logger.info(`=================================`);
    });
};
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger_1.logger.error(`UNHANDLED REJECTION! Shutting down... Reason: ${err.message}`);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
// Start the app
startServer();
