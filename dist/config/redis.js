"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.cache = void 0;
const redis_1 = require("redis");
const environment_1 = require("./environment");
const logger_1 = require("../core/utils/logger");
// Memory fallback store
class MemoryCacheStore {
    store = new Map();
    async get(key) {
        const item = this.store.get(key);
        if (!item)
            return null;
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, expirationSeconds) {
        const expiresAt = expirationSeconds ? Date.now() + expirationSeconds * 1000 : undefined;
        this.store.set(key, { value, expiresAt });
    }
    async del(key) {
        this.store.delete(key);
    }
}
let redisClient = null;
exports.redisClient = redisClient;
let cache = new MemoryCacheStore();
exports.cache = cache;
// Only initialize Redis in production when REDIS_URL is explicitly provided
if (environment_1.env.NODE_ENV === 'production' && environment_1.env.REDIS_URL && environment_1.env.REDIS_URL.trim() !== '') {
    exports.redisClient = redisClient = (0, redis_1.createClient)({
        url: environment_1.env.REDIS_URL,
    });
    redisClient.on('error', (err) => {
        const msg = err && err.message ? err.message : String(err || 'unknown');
        logger_1.logger.error(`Redis Error: ${msg}`);
    });
    redisClient.on('connect', () => {
        logger_1.logger.info('Redis connected successfully.');
    });
    // Connect asynchronously
    redisClient.connect().then(() => {
        exports.cache = cache = {
            async get(key) {
                return redisClient.get(key);
            },
            async set(key, value, expirationSeconds) {
                if (expirationSeconds) {
                    await redisClient.set(key, value, { EX: expirationSeconds });
                }
                else {
                    await redisClient.set(key, value);
                }
            },
            async del(key) {
                await redisClient.del(key);
            },
        };
    }).catch((err) => {
        const msg = err && err.message ? err.message : String(err || 'unknown');
        logger_1.logger.warn(`Redis connection failed: ${msg}. Defaulting to In-Memory cache.`);
    });
}
else {
    logger_1.logger.warn('Redis not initialized (non-production or REDIS_URL missing). Using in-memory cache.');
}
