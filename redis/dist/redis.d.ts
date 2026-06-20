import { IRedisConfig } from './interface';
/**
 * @description Redis storage utility class
 * Manages read/write Redis clients and provides high-level helper methods
 * for keys, hashes, lists, locks, and counters.
 */
declare class RedisStorage {
    private clientWrite;
    private clientRead;
    /**
     * @description Create a new RedisStorage instance
     * Use the exported singleton `redis` for most use cases.
     */
    constructor();
    /**
     * @description Initialize Redis read/write connections
     * @param {IRedisConfig} config - Redis connection configuration
     */
    initiateRedisConnection(config: IRedisConfig): void;
    /**
     * @description Build Redis connection configuration for read/write replica
     * @param {REDIS_CLUSTER_TYPE} clusterType - 'READ' or 'WRITE'
     * @param {IRedisConfig} config - Base Redis configuration
     * @returns {RedisOptions} Resolved Redis options
     */
    private getConfiguration;
    /**
     * @description Register connection lifecycle events for write client
     */
    private registerRedisClientEventForWrite;
    /**
     * @description Register connection lifecycle events for read client
     */
    private registerRedisClientEventForRead;
    /**
     * @description Set key in Redis
     * @param key - Redis key
     * @param value - String value to store
     * @returns {Promise<string | null>} Result from Redis
     */
    setKey(key: string, value: string): Promise<"OK">;
    /**
     * @description Set key in redis with expiry (in seconds)
     * @param key - Redis key
     * @param value - String value to store
     * @param seconds - Expiry time in seconds
     * @returns {Promise<string | null>} Result from Redis
     */
    setKeyWithExpiry(key: string, value: string, seconds: number): Promise<"OK">;
    /**
     * @description Get value from Redis by key
     * @param key - Redis key
     * @returns {Promise<string | null>} Stored value or null if not found
     */
    getKey(key: string): Promise<string | null>;
    /**
     * @description Set expiry for a key in Redis (in seconds)
     * @param key - Redis key
     * @param seconds - Expiry time in seconds
     * @returns {Promise<number>} 1 if timeout was set, 0 otherwise
     */
    setExpiry(key: string, seconds: number): Promise<number>;
    /**
     * @description Delete key from Redis
     * @param key - Redis key
     * @returns {Promise<number>} Number of keys that were removed
     */
    delKey(key: string): Promise<number>;
    /**
     * @description Set field in a Redis hash
     * @param hashName - Hash key
     * @param key - Field name
     * @param value - Field value
     * @returns {Promise<number>} 1 if field is a new field, 0 if updated
     */
    setHash(hashName: string, key: string, value: string): Promise<number>;
    /**
     * @description Get value from Redis hash by field/key name
     * @param hashName - Hash key
     * @param key - Field name
     * @returns {Promise<string | null>} Field value or null
     */
    getHash(hashName: string, key: string): Promise<string | null>;
    /**
     * @description Update field/key value in Redis hash
     * @param hashName - Hash key
     * @param key - Field name
     * @param field - Unused, kept for backward compatibility
     * @param value - New value
     * @returns {Promise<number>} 1 if field is new, 0 if updated
     */
    updateHash(hashName: string, key: string, field: string, value: string): Promise<number>;
    /**
     * @description Set hash field in Redis with expiry for that field
     * @param hashName - Hash key
     * @param key - Field name
     * @param value - Field value
     * @param seconds - Expiry time in seconds
     * @returns {Promise<number>} 1 if field is new, 0 if updated
     */
    setHashWithExpiry(hashName: string, key: string, value: string, seconds: number): Promise<number>;
    /**
     * @description Set expiry for a field inside Redis hash
     * @param hashName - Hash key
     * @param key - Field name
     * @param seconds - Expiry time in seconds
     * @returns {Promise<number>} 1 if timeout was set, 0 otherwise
     */
    setHashExpiry(hashName: string, key: string, seconds: number): Promise<number>;
    /**
     * @description Delete specific field/key from Redis hash
     * @param hashName - Hash key
     * @param key - Field name
     * @returns {Promise<number>} Number of fields removed
     */
    delKeyFromHash(hashName: string, key: string): Promise<number>;
    /**
     * @description Insert array of items into a Redis list with TTL
     * @param key - List key
     * @param data - Array of items to push
     * @param ttl - Expiry time in seconds (default: 3600)
     */
    insertInList(key: string, data: any, ttl?: number): Promise<void>;
    /**
     * @description Read data from list using lrange
     * @param key - List key
     * @param skip - Start index
     * @param limit - End index
     * @returns {Promise<string[]>} Array of list items
     */
    readList(key: string, skip: number, limit: number): Promise<string[]>;
    /**
     * @description Implementing GETSET in Redis with expiry
     * @param key - Redis key
     * @param value - New value
     * @param seconds - Expiry time in seconds
     */
    getSetInRedis(key: string, value: string, seconds: number): Promise<string | null>;
    /**
     * @description Expire a key from Redis after a certain time
     * @param key - Base key
     * @param prefix - String to append to key
     * @param expireAt - Expiry time in seconds
     */
    expireKeyFromRedis(key: string, prefix: string, expireAt: number): Promise<void>;
    /**
     * @description GETSET key in redis with expiry
     * @param key - Redis key
     * @param value - New value
     * @param seconds - Expiry time in seconds
     * @returns {Promise<string | null>} Previous value or null
     */
    getSetKeyWithExpiry(key: string, value: string, seconds: number): Promise<string | null>;
    /**
     * @description Set expiry for a key in Redis in milliseconds
     * @param key - Redis key
     * @param ms - Expiry time in milliseconds
     * @returns {Promise<number>} 1 if timeout was set, 0 otherwise
     */
    setPexpiry(key: string, ms: number): Promise<number>;
    /**
     * @description Increment numeric field in Redis hash
     * @param hashName - Hash key
     * @param key - Field name
     * @param incrby - Increment value
     * @returns {Promise<number>} New value after increment
     */
    incrementHash(hashName: string, key: string, incrby: number): Promise<number>;
    /**
     * @description Acquire a simple distributed lock using SET NX PX
     * @param lockKey - Lock key
     * @param lockTTL - Lock TTL in milliseconds
     * @param waitTime - Maximum wait time to acquire lock in milliseconds
     * @returns {Promise<boolean>} True if lock acquired, false otherwise
     */
    acquireLock(lockKey: string, lockTTL: number, waitTime: number): Promise<boolean>;
    /**
     * @description Increment numeric key in Redis
     * @param key - Redis key
     * @returns {Promise<number>} New value after increment
     */
    incrementKey(key: string): Promise<number>;
    /**
     * @description Sleep helper used for retry loops
     * @param ms - Milliseconds to wait
     */
    private sleep;
}
export declare const redis: RedisStorage;
export {};
