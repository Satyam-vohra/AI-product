"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const environment_1 = require("./environment");
const logger_1 = require("../core/utils/logger");
if (environment_1.env.CLOUDINARY_CLOUD_NAME !== 'mock') {
    cloudinary_1.v2.config({
        cloud_name: environment_1.env.CLOUDINARY_CLOUD_NAME,
        api_key: environment_1.env.CLOUDINARY_API_KEY,
        api_secret: environment_1.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
    logger_1.logger.info('Cloudinary initialized successfully.');
}
else {
    logger_1.logger.warn('Cloudinary config is using mock mode. File uploads will be mocked or saved locally.');
}
