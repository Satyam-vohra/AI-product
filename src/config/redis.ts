import { createClient } from 'redis';
import { env } from './environment';
import { logger } from '../core/utils/logger';

interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, expirationSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

// Memory fallback store
class MemoryCacheStore implements CacheStore {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    const expiresAt = expirationSeconds ? Date.now() + expirationSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

let redisClient: any = null;
let cache: CacheStore = new MemoryCacheStore();

// Only initialize Redis in production when REDIS_URL is explicitly provided
if (env.NODE_ENV === 'production' && env.REDIS_URL && env.REDIS_URL.trim() !== '') {
  redisClient = createClient({
    url: env.REDIS_URL,
  });

  redisClient.on('error', (err: any) => {
    const msg = err && err.message ? err.message : String(err || 'unknown');
    logger.error(`Redis Error: ${msg}`);
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected successfully.');
  });

  // Connect asynchronously
  redisClient.connect().then(() => {
    cache = {
      async get(key: string): Promise<string | null> {
        return redisClient.get(key);
      },
      async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
        if (expirationSeconds) {
          await redisClient.set(key, value, { EX: expirationSeconds });
        } else {
          await redisClient.set(key, value);
        }
      },
      async del(key: string): Promise<void> {
        await redisClient.del(key);
      },
    };
  }).catch((err: any) => {
    const msg = err && err.message ? err.message : String(err || 'unknown');
    logger.warn(`Redis connection failed: ${msg}. Defaulting to In-Memory cache.`);
  });
} else {
  logger.warn('Redis not initialized (non-production or REDIS_URL missing). Using in-memory cache.');
}

export { cache, redisClient };
