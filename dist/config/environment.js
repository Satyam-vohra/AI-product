"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// Load .env file
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(5000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    MONGO_URI: zod_1.z.string().min(1, 'MONGO_URI is required'),
    REDIS_URL: zod_1.z.string().optional(),
    JWT_SECRET: zod_1.z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 characters long'),
    JWT_ACCESS_EXPIRATION: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRATION: zod_1.z.string().default('7d'),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional().default('mock'),
    CLOUDINARY_API_KEY: zod_1.z.string().optional().default('mock'),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional().default('mock'),
    OPENAI_API_KEY: zod_1.z.string().optional().default('mock'),
});
const parseEnv = () => {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ Invalid environment variables Configuration:', result.error.format());
        process.exit(1);
    }
    return result.data;
};
exports.env = parseEnv();
