"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("../../config/cloudinary");
const environment_1 = require("../../config/environment");
const app_error_1 = require("../errors/app-error");
const logger_1 = require("./logger");
// Configure Multer storage to memory
const storage = multer_1.default.memoryStorage();
// Set file type filters
const fileFilter = (req, file, cb) => {
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
    }
    else {
        cb(new app_error_1.BadRequestError(`Unsupported file format: ${file.mimetype}. Only JPEG, PNG, WEBP, PDF, TXT, and Word documents are allowed.`));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
const uploadToCloudinary = async (fileBuffer, folder, originalName) => {
    if (environment_1.env.CLOUDINARY_CLOUD_NAME === 'mock' || !environment_1.env.CLOUDINARY_CLOUD_NAME) {
        logger_1.logger.info(`[MOCK UPLOAD] Simulating file upload for ${originalName} into folder: ${folder}`);
        const randomId = Math.random().toString(36).substring(7);
        return {
            url: `https://res.cloudinary.com/mock-cloud/image/upload/v12345678/${folder}/${randomId}_${originalName}`,
            publicId: `${folder}/${randomId}_${originalName}`,
            bytes: fileBuffer.length,
            format: originalName.split('.').pop() || 'unknown',
        };
    }
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.cloudinary.uploader.upload_stream({
            folder,
            resource_type: 'auto',
        }, (error, result) => {
            if (error) {
                logger_1.logger.error(`Cloudinary upload failed: ${error.message}`);
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
        });
        uploadStream.end(fileBuffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
