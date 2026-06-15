interface CacheStore {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, expirationSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
}
declare let redisClient: any;
declare let cache: CacheStore;
export { cache, redisClient };
