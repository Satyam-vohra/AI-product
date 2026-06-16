import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  REDIS_URL: z.string().optional(),
  CLIENT_URL: z.string().optional().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 characters long'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default('mock'),
  CLOUDINARY_API_KEY: z.string().optional().default('mock'),
  CLOUDINARY_API_SECRET: z.string().optional().default('mock'),
  OPENAI_API_KEY: z.string().optional().default('mock'),
  OPENAI_MODEL: z.string().optional().default('gpt-4o-mini'),
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables Configuration:', result.error.format());
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
export type Environment = z.infer<typeof envSchema>;
