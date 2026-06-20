import { Redis } from 'ioredis';
import { IRedisConfig } from '../interface';
/**
 * @description Redis connection manager for BullMQ
 * Initializes read/write ioredis clients and exposes the write client for queues/workers
 */
export declare class RedisConnection {
    private clientWrite?;
    private clientRead?;
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
     * @description Whether write client has been initialized
     */
    isConnected(): boolean;
    /**
     * @description Get write Redis client for BullMQ queues and workers
     */
    getWriteClient(): Redis;
    /**
     * @description Get read Redis client (optional replica)
     */
    getReadClient(): Redis;
    /**
     * @description Alias for getWriteClient — use with bullMQ.setConnection(redisConnection.getConnection())
     */
    getConnection(): Redis;
    /**
     * @description Close read and write Redis connections
     */
    disconnect(): Promise<void>;
}
/** Pre-configured Redis connection singleton */
export declare const redisConnection: RedisConnection;
