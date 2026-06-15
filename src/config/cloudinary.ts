import { v2 as cloudinary } from 'cloudinary';
import { env } from './environment';
import { logger } from '../core/utils/logger';

if (env.CLOUDINARY_CLOUD_NAME !== 'mock') {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info('Cloudinary initialized successfully.');
} else {
  logger.warn('Cloudinary config is using mock mode. File uploads will be mocked or saved locally.');
}

export { cloudinary };
