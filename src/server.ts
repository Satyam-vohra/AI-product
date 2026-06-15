import app from './app';
import { env } from './config/environment';
import { connectDatabase } from './config/database';
import { logger } from './core/utils/logger';
import VectorDB from './application/services/vector-db-service';

// Handle uncaught exceptions globally to prevent silent failures
process.on('uncaughtException', (err: Error) => {
  logger.error(`UNCAUGHT EXCEPTION! Shutting down... Reason: ${err.message}`);
  process.exit(1);
});

let server: any;

const startServer = async () => {
  // Connect to Database first
  await connectDatabase();

  // Warm up in-memory vector index from knowledge base embeddings
  try {
    await VectorDB.loadIndex();
    logger.info('VectorDB: Loaded KB embeddings into memory index');
  } catch (err) {
    logger.warn('VectorDB: Failed to warm index at startup');
  }

  const initialPort = Number(env.PORT || 5000);
  const maxPortTries = 10;

  const listenWithPortFallback = (): void => {
    const tryListen = (port: number, remainingTries: number): void => {
      server = app.listen(port, () => {
        logger.info(`=================================`);
        logger.info(`  Mantis AI Backend Active      `);
        logger.info(`  Environment: ${env.NODE_ENV}  `);
        logger.info(`  Port: ${port}                  `);
        logger.info(`=================================`);
      });

      server.on('error', (err: any) => {
        if (err?.code === 'EADDRINUSE' && remainingTries > 0) {
          logger.warn(
            `Port ${port} is already in use (EADDRINUSE). Trying next port... (remaining tries: ${remainingTries})`
          );
          // Close current server instance if it's in a bad state
          try {
            server?.close?.();
          } catch {
            // ignore
          }
          tryListen(port + 1, remainingTries - 1);
          return;
        }

        // Bubble up to global handler for clarity
        throw err;
      });
    };

    tryListen(initialPort, maxPortTries - 1);
  };

  listenWithPortFallback();
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  logger.error(`UNHANDLED REJECTION! Shutting down... Reason: ${err.message}`);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

/**
 * Start the app
 * (keep process stable: no silent async failures)
 */
startServer().catch((err) => {
  logger.error(`SERVER STARTUP FAILED: ${err instanceof Error ? err.message : String(err)}`);
  if (server?.close) {
    try {
      server.close(() => process.exit(1));
    } catch {
      process.exit(1);
    }
  } else {
    process.exit(1);
  }
});
