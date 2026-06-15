import mongoose from 'mongoose';
import { env } from './environment';
import { logger } from '../core/utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const options = {
      autoIndex: true, // Auto-build indexes in development/test
    };

    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected.');
    });

    await mongoose.connect(env.MONGO_URI, options);
  } catch (error: any) {
    logger.error(`Failed to connect to database: ${error.message}`);
    process.exit(1);
  }
};
export default connectDatabase;
