import multer from 'multer';
import { cloudinary } from '../../config/cloudinary';
import { env } from '../../config/environment';
import { BadRequestError } from '../errors/app-error';
import { logger } from './logger';

// Configure Multer storage to memory
const storage = multer.memoryStorage();

// Set file type filters
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`Unsupported file format: ${file.mimetype}. Only JPEG, PNG, WEBP, PDF, TXT, and Word documents are allowed.`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export interface UploadResult {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
}

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  originalName: string
): Promise<UploadResult> => {
  if (env.CLOUDINARY_CLOUD_NAME === 'mock' || !env.CLOUDINARY_CLOUD_NAME) {
    logger.info(`[MOCK UPLOAD] Simulating file upload for ${originalName} into folder: ${folder}`);
    const randomId = Math.random().toString(36).substring(7);
    return {
      url: `https://res.cloudinary.com/mock-cloud/image/upload/v12345678/${folder}/${randomId}_${originalName}`,
      publicId: `${folder}/${randomId}_${originalName}`,
      bytes: fileBuffer.length,
      format: originalName.split('.').pop() || 'unknown',
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload failed: ${error.message}`);
          return reject(new Error('Cloudinary upload failed'));
        }
        if (!result) {
          return reject(new Error('Cloudinary upload returned empty result'));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};
