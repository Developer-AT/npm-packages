import { Redis, RedisOptions } from 'ioredis';
import { IRedisConfig, REDIS_CLUSTER_TYPE } from './interface';
import { RedisException } from './exception-handler';

/**
 * @description Redis storage utility class
 * Manages read/write Redis clients and provides high-level helper methods
 * for keys, hashes, lists, locks, and counters.
 */
class RedisStorage {
    private clientWrite: Redis;
    private clientRead: Redis;

    /**
     * @description Create a new RedisStorage instance
     * Use the exported singleton `redis` for most use cases.
     */
    constructor() {}

    /**
     * @description Initialize Redis read/write connections
     * @param {IRedisConfig} config - Redis connection configuration
     */
    initiateRedisConnection(config: IRedisConfig) {
        if (!this.clientWrite) {
            this.clientWrite = new Redis(this.getConfiguration('WRITE', config));
            this.registerRedisClientEventForWrite();
        }
        if (!this.clientRead) {
            this.clientRead = new Redis(this.getConfiguration('READ', config));
            this.registerRedisClientEventForRead();
        }
    }

    /**
     * @description Build Redis connection configuration for read/write replica
     * @param {REDIS_CLUSTER_TYPE} clusterType - 'READ' or 'WRITE'
     * @param {IRedisConfig} config - Base Redis configuration
     * @returns {RedisOptions} Resolved Redis options
     */
    private getConfiguration(clusterType: REDIS_CLUSTER_TYPE, config: IRedisConfig): RedisOptions {
        let authConfig: RedisOptions = {
            db: config.db || 0
        };
        if(config.isTlsEnabled) {
            authConfig.tls = config.tlsOptions;
        }

        if(config.password) {
            authConfig.password = config.password;
        }
        let creds: RedisOptions;
        if (clusterType == 'READ') {
            creds = {
                host: config.readReplicaHost,
                port: config.readReplicaPort,
                ...authConfig
            };
        } else {
            creds = {
                host: config.writeReplicaHost,
                port: config.writeReplicaPort,
                ...authConfig
            };
        }

        return creds;
    }

    /**
     * @description Register connection lifecycle events for write client
     */
    private registerRedisClientEventForWrite() {
        this.clientWrite.on('connect', () => {
            console.info('Redis Client Write Connected SuccessFully');
            this.setKey('test', 'Test Connection inside file');
        });
        this.clientWrite.on('ready', () => {
            console.info('Redis Client Write Ready');
        });
        this.clientWrite.on('error', (err) => {
            console.error('Redis Client Write error occurs while connecting', err);
        });
        this.clientWrite.on('close', () => {
            console.error('Redis Client Write connection has closed.');
        });
        this.clientWrite.on('end', () => {
            console.info('Redis Client Write connection is failed to establish');
        });
    }

    /**
     * @description Register connection lifecycle events for read client
     */
    private registerRedisClientEventForRead() {
        this.clientRead.on('connect', () => {
            console.info('Redis Client Read Connected SuccessFully');
            this.getKey('test');
        });
        this.clientRead.on('ready', () => {
            console.info('Redis Client Read Ready');
        });
        this.clientRead.on('error', (err) => {
            console.error('Redis Client Read error occurs while connecting', err);
        });
        this.clientRead.on('close', () => {
            console.error('Redis Client Read connection has closed.');
        });
        this.clientRead.on('end', () => {
            console.info('Redis Client Read connection is failed to establish');
        });
    }

    /**
     * @description Set key in Redis
     * @param key - Redis key
     * @param value - String value to store
     * @returns {Promise<string | null>} Result from Redis
     */
    async setKey(key: string, value: string) {
        try {
            return await this.clientWrite.set(key, value);
        } catch (error) {
            console.error('Redis storage set', error, false);
            throw new RedisException(error, { operation: 'setKey', key }).getError();
        }
    }

    /**
     * @description Set key in redis with expiry (in seconds)
     * @param key - Redis key
     * @param value - String value to store
     * @param seconds - Expiry time in seconds
     * @returns {Promise<string | null>} Result from Redis
     */
    async setKeyWithExpiry(key: string, value: string, seconds: number) {
        try {
            const data = await this.clientWrite.set(key, value);
            await this.setExpiry(key, seconds);
            return data;
        } catch (error) {
            console.error('Redis storage setKeyWithExpiry', error, false);
            throw new RedisException(error, { operation: 'setKeyWithExpiry', key }).getError();
        }
    }

    /**
     * @description Get value from Redis by key
     * @param key - Redis key
     * @returns {Promise<string | null>} Stored value or null if not found
     */
    async getKey(key: string) {
        try {
            return await this.clientRead.get(key);
        } catch (error) {
            console.error('Redis storage getKey', error, false);
            throw new RedisException(error, { operation: 'getKey', key }).getError();
        }
    }

    /**
     * @description Set expiry for a key in Redis (in seconds)
     * @param key - Redis key
     * @param seconds - Expiry time in seconds
     * @returns {Promise<number>} 1 if timeout was set, 0 otherwise
     */
    async setExpiry(key: string, seconds: number) {
        try {
            return await this.clientWrite.expire(key, seconds);
        } catch (error) {
            console.error('Redis storage setExpiry', error, false);
            throw new RedisException(error, { operation: 'setExpiry', key }).getError();
        }
    }

    /**
     * @description Delete key from Redis
     * @param key - Redis key
     * @returns {Promise<number>} Number of keys that were removed
     */
    async delKey(key: string) {
        try {
            return await this.clientWrite.del(key);
        } catch (error) {
            console.error('Redis storage delKey', error, false);
            throw new RedisException(error, { operation: 'delKey', key }).getError();
        }
    }

    /**
     * @description Set field in a Redis hash
     * @param hashName - Hash key
     * @param key - Field name
     * @param value - Field value
     * @returns {Promise<number>} 1 if field is a new field, 0 if updated
     */
    async setHash(hashName: string, key: string, value: string) {
        try {
            return await this.clientWrite.hset(hashName, key, value);
        } catch (error) {
            console.error('Redis storage setHash', error, false);
            throw new RedisException(error, { operation: 'setHash', hashName, key }).getError();
        }
    }

    /**
     * @description Get value from Redis hash by field/key name
     * @param hashName - Hash key
     * @param key - Field name
     * @returns {Promise<string | null>} Field value or null
     */
    async getHash(hashName: string, key: string) {
        try {
            return await this.clientRead.hget(hashName, key);
        } catch (error) {
            console.error('Redis storage getHash', error, false);
            throw new RedisException(error, { operation: 'getHash', hashName, key }).getError();
        }
    }

    /**
     * @description Update field/key value in Redis hash
     * @param hashName - Hash key
     * @param key - Field name
     * @param field - Unused, kept for backward compatibility
     * @param value - New value
     * @returns {Promise<number>} 1 if field is new, 0 if updated
     */
    async updateHash(hashName: string, key: string, field: string, value: string) {
        try {
            return await this.clientWrite.hset(hashName, key, field, value);
        } catch (error) {
            console.error('Redis storage updateHash', error, false);
            throw new RedisException(error, { operation: 'updateHash', hashName, key }).getError();
        }
    }

    /**
     * @description Set hash field in Redis with expiry for that field
     * @param hashName - Hash key
     * @param key - Field name
     * @param value - Field value
     * @param seconds - Expiry time in seconds
     * @returns {Promise<number>} 1 if field is new, 0 if updated
     */
    async setHashWithExpiry(hashName: string, key: string, value: string, seconds: number) {
        try {
            const data = await this.clientWrite.hset(hashName, key, value);
            await this.setHashExpiry(hashName, key, seconds);
            return data;
        } catch (error) {
            console.error('Redis storage setHashWithExpiry', error, false);
            throw new RedisException(error, { operation: 'setHashWithExpiry', hashName, key }).getError();
        }
    }

    /**
     * @description Set expiry for a field inside Redis hash
     * @param hashName - Hash key
     * @param key - Field name
     * @param seconds - Expiry time in seconds
     * @returns {Promise<number>} 1 if timeout was set, 0 otherwise
     */
    async setHashExpiry(hashName: string, key: string, seconds: number) {
        try {
            return await this.clientWrite.expire(`${hashName}:${key}`, seconds);
        } catch (error) {
            console.error('Redis storage setHashExpiry', error, false);
            throw new RedisException(error, { operation: 'setHashExpiry', hashName, key }).getError();
        }
    }

    /**
     * @description Delete specific field/key from Redis hash
     * @param hashName - Hash key
     * @param key - Field name
     * @returns {Promise<number>} Number of fields removed
     */
    async delKeyFromHash(hashName: string, key: string) {
        try {
            return await this.clientWrite.hdel(hashName, key);
        } catch (error) {
            console.error('Redis storage delKeyFromHash', error, false);
            throw new RedisException(error, { operation: 'delKeyFromHash', hashName, key }).getError();
        }
    }

    /**
     * @description Insert array of items into a Redis list with TTL
     * @param key - List key
     * @param data - Array of items to push
     * @param ttl - Expiry time in seconds (default: 3600)
     */
    async insertInList(key: string, data: any, ttl: number = 3600) {
        try {
            const pipeline = this.clientWrite.pipeline();
            const totalCount = data.length;
            for (let index = 0; index < totalCount; index++) {
                data[index].totalCount = totalCount;
                await pipeline.rpush(key, JSON.stringify(data[index]));
            }
            pipeline.expire(key, ttl);
            await pipeline.exec();
            return;
        } catch (error) {
            console.error('Redis storage insertInList', error, false);
            throw new RedisException(error, { operation: 'insertInList', key }).getError();
        }
    }

    /**
     * @description Read data from list using lrange
     * @param key - List key
     * @param skip - Start index
     * @param limit - End index
     * @returns {Promise<string[]>} Array of list items
     */
    async readList(key: string, skip: number, limit: number) {
        try {
            return await this.clientRead.lrange(key, skip, limit);
        } catch (error) {
            console.error('Redis storage readList', error, false);
            throw new RedisException(error, { operation: 'readList', key }).getError();
        }
    }

    /**
     * @description Implementing GETSET in Redis with expiry
     * @param key - Redis key
     * @param value - New value
     * @param seconds - Expiry time in seconds
     */
    async getSetInRedis(key: string, value: string, seconds: number) {
        try {
            const keyInRedis = await this.clientWrite.getset(key, value);
            await this.setExpiry(key, seconds);
            return keyInRedis;
        } catch (error) {
            console.error('Redis GetSet Error', error, false);
            throw new RedisException(error, { operation: 'getSetInRedis', key }).getError();
        }
    }

    /**
     * @description Expire a key from Redis after a certain time
     * @param key - Base key
     * @param prefix - String to append to key
     * @param expireAt - Expiry time in seconds
     */
    async expireKeyFromRedis(key: string, prefix: string, expireAt: number) {
        try {
            await this.clientWrite.expire(key.toString() + prefix, expireAt);
        } catch (error) {
            console.error('Redis storage expireKeyFromRedis', error, false);
            throw new RedisException(error, { operation: 'expireKeyFromRedis', key }).getError();
        }
    }

    /**
     * @description GETSET key in redis with expiry
     * @param key - Redis key
     * @param value - New value
     * @param seconds - Expiry time in seconds
     * @returns {Promise<string | null>} Previous value or null
     */
    async getSetKeyWithExpiry(key: string, value: string, seconds: number) {
        try {
            const data = await this.clientWrite.getset(key, value);
            await this.setExpiry(key, seconds);
            return data;
        } catch (error) {
            console.error('Redis storage getSetKeyWithExpiry', error, false);
            throw new RedisException(error, { operation: 'getSetKeyWithExpiry', key }).getError();
        }
    }

    /**
     * @description Set expiry for a key in Redis in milliseconds
     * @param key - Redis key
     * @param ms - Expiry time in milliseconds
     * @returns {Promise<number>} 1 if timeout was set, 0 otherwise
     */
    async setPexpiry(key: string, ms: number) {
        try {
            return await this.clientWrite.pexpire(key, ms);
        } catch (error) {
            console.error('Redis storage setPexpiry', error, false);
            throw new RedisException(error, { operation: 'setPexpiry', key }).getError();
        }
    }

    /**
     * @description Increment numeric field in Redis hash
     * @param hashName - Hash key
     * @param key - Field name
     * @param incrby - Increment value
     * @returns {Promise<number>} New value after increment
     */
    async incrementHash(hashName: string, key: string, incrby: number) {
        try {
            return await this.clientWrite.hincrby(hashName, key, incrby);
        } catch (error) {
            console.error('Redis storage setHash', error, false);
            throw new RedisException(error, { operation: 'incrementHash', hashName, key }).getError();
        }
    }

    /**
     * @description Acquire a simple distributed lock using SET NX PX
     * @param lockKey - Lock key
     * @param lockTTL - Lock TTL in milliseconds
     * @param waitTime - Maximum wait time to acquire lock in milliseconds
     * @returns {Promise<boolean>} True if lock acquired, false otherwise
     */
    async acquireLock(lockKey: string, lockTTL: number, waitTime: number) {
        try {
            const startTime = Date.now();
            while (Date.now() - startTime < waitTime) {
                const lockAcquired = await this.clientWrite.set(lockKey, 'locked', 'PX', lockTTL, 'NX');
                if (lockAcquired) return true; // Lock acquired successfully

                // Wait for a short time before retrying
                await this.sleep(100);
            }

            return false;
        } catch (error) {
            console.error('Redis storage acquireLock', error, false);
            throw new RedisException(error, { operation: 'acquireLock', key: lockKey }).getError();
        }
    }

    /**
     * @description Increment numeric key in Redis
     * @param key - Redis key
     * @returns {Promise<number>} New value after increment
     */
    async incrementKey(key: string) {
        try {
            return await this.clientWrite.incr(key);
        } catch (error) {
            console.error('Redis storage incrementKey', error, false);
            throw new RedisException(error, { operation: 'incrementKey', key }).getError();
        }
    }

    /**
     * @description Sleep helper used for retry loops
     * @param ms - Milliseconds to wait
     */
    private async sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export const redis = new RedisStorage();
