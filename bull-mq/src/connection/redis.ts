import { Redis, RedisOptions } from 'ioredis';
import { IRedisConfig, REDIS_CLUSTER_TYPE } from '../interface';

/**
 * @description Redis connection manager for BullMQ
 * Initializes read/write ioredis clients and exposes the write client for queues/workers
 */
export class RedisConnection {
    private clientWrite?: Redis;
    private clientRead?: Redis;

    /**
     * @description Initialize Redis read/write connections
     * @param {IRedisConfig} config - Redis connection configuration
     */
    initiateRedisConnection(config: IRedisConfig): void {
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
        const authConfig: RedisOptions = {
            db: config.db || 0
        };

        if (config.isTlsEnabled) {
            authConfig.tls = config.tlsOptions;
        }

        if (config.password) {
            authConfig.password = config.password;
        }

        if (clusterType === 'READ') {
            return {
                host: config.readReplicaHost,
                port: config.readReplicaPort,
                ...authConfig
            };
        }

        // BullMQ workers use blocking Redis commands; ioredis must not cap per-command retries
        return {
            host: config.writeReplicaHost,
            port: config.writeReplicaPort,
            maxRetriesPerRequest: null,
            ...authConfig
        };
    }

    /**
     * @description Register connection lifecycle events for write client
     */
    private registerRedisClientEventForWrite(): void {
        if (!this.clientWrite) {
            return;
        }

        this.clientWrite.on('connect', () => {
            console.info('BullMQ Redis Client Write Connected Successfully');
        });
        this.clientWrite.on('ready', () => {
            console.info('BullMQ Redis Client Write Ready');
        });
        this.clientWrite.on('error', (err) => {
            console.error('BullMQ Redis Client Write error occurs while connecting', err);
        });
        this.clientWrite.on('close', () => {
            console.error('BullMQ Redis Client Write connection has closed.');
        });
        this.clientWrite.on('end', () => {
            console.info('BullMQ Redis Client Write connection ended');
        });
    }

    /**
     * @description Register connection lifecycle events for read client
     */
    private registerRedisClientEventForRead(): void {
        if (!this.clientRead) {
            return;
        }

        this.clientRead.on('connect', () => {
            console.info('BullMQ Redis Client Read Connected Successfully');
        });
        this.clientRead.on('ready', () => {
            console.info('BullMQ Redis Client Read Ready');
        });
        this.clientRead.on('error', (err) => {
            console.error('BullMQ Redis Client Read error occurs while connecting', err);
        });
        this.clientRead.on('close', () => {
            console.error('BullMQ Redis Client Read connection has closed.');
        });
        this.clientRead.on('end', () => {
            console.info('BullMQ Redis Client Read connection ended');
        });
    }

    /**
     * @description Whether write client has been initialized
     */
    isConnected(): boolean {
        return this.clientWrite !== undefined;
    }

    /**
     * @description Get write Redis client for BullMQ queues and workers
     */
    getWriteClient(): Redis {
        if (!this.clientWrite) {
            throw new Error(
                'Redis is not connected. Call initiateRedisConnection(config) or bullMQ.initFromRedisConfig(config) first.'
            );
        }
        return this.clientWrite;
    }

    /**
     * @description Get read Redis client (optional replica)
     */
    getReadClient(): Redis {
        if (!this.clientRead) {
            throw new Error(
                'Redis read client is not connected. Call initiateRedisConnection(config) first.'
            );
        }
        return this.clientRead;
    }

    /**
     * @description Alias for getWriteClient — use with bullMQ.setConnection(redisConnection.getConnection())
     */
    getConnection(): Redis {
        return this.getWriteClient();
    }

    /**
     * @description Close read and write Redis connections
     */
    async disconnect(): Promise<void> {
        const tasks: Promise<'OK'>[] = [];

        if (this.clientWrite) {
            tasks.push(this.clientWrite.quit());
            this.clientWrite = undefined;
        }
        if (this.clientRead) {
            tasks.push(this.clientRead.quit());
            this.clientRead = undefined;
        }

        await Promise.all(tasks);
        console.info('BullMQ Redis connections disconnected');
    }
}

/** Pre-configured Redis connection singleton */
export const redisConnection = new RedisConnection();
