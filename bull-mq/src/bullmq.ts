import type { ConnectionOptions, JobsOptions, QueueOptions, WorkerOptions } from 'bullmq';
import { redisConnection } from './connection';
import type { IRedisConfig } from './interface';

/**
 * @description BullMQ manager — holds injected Redis connection and shared defaults
 * Does not create Queue/Worker instances; wrappers compose this manager
 */
export class BullMQManager {
    private connection: ConnectionOptions | null = null;
    private prefix?: string;
    private defaultJobOptions?: JobsOptions;

    /**
     * @description Set Redis connection for this manager instance (ioredis client or RedisOptions)
     * @param {ConnectionOptions} connection - Injected Redis connection from the host application
     */
    setConnection(connection: ConnectionOptions): void {
        this.connection = connection;
    }

    /**
     * @description Initialize Redis from package connection module and bind write client to this manager
     * @param {IRedisConfig} config - Read/write replica Redis configuration
     */
    initFromRedisConfig(config: IRedisConfig): void {
        redisConnection.initiateRedisConnection(config);
        this.setConnection(redisConnection.getWriteClient());
    }

    /**
     * @description Optional key prefix for all BullMQ queues on this manager
     * @param {string} prefix - BullMQ prefix (e.g. `{app}`)
     */
    setPrefix(prefix: string): void {
        this.prefix = prefix;
    }

    /**
     * @description Default job options applied when merging queue options
     * @param {JobsOptions} opts - Default job options
     */
    setDefaultJobOptions(opts: JobsOptions): void {
        this.defaultJobOptions = opts;
    }

    /**
     * @description Whether setConnection has been called on this instance
     */
    isConfigured(): boolean {
        return this.connection !== null;
    }

    /**
     * @description Returns the configured Redis connection
     */
    getConnectionOptions(): ConnectionOptions {
        if (!this.connection) {
            throw new Error(
                'BullMQ is not configured. Call setConnection(redis) on this BullMQManager instance first.'
            );
        }
        return this.connection;
    }

    /**
     * @description Build QueueOptions by merging manager defaults with overrides
     * @param {Omit<QueueOptions, 'connection'>} overrides - Per-queue options (without connection)
     */
    getQueueOptions(overrides?: Omit<QueueOptions, 'connection'>): QueueOptions {
        return {
            connection: this.getConnectionOptions(),
            prefix: overrides?.prefix ?? this.prefix,
            defaultJobOptions: {
                ...this.defaultJobOptions,
                ...overrides?.defaultJobOptions
            },
            ...overrides
        };
    }

    /**
     * @description Build WorkerOptions by merging manager defaults with overrides
     * @param {Omit<WorkerOptions, 'connection'>} overrides - Per-worker options (without connection)
     */
    getWorkerOptions(overrides?: Omit<WorkerOptions, 'connection'>): WorkerOptions {
        return {
            connection: this.getConnectionOptions(),
            prefix: overrides?.prefix ?? this.prefix,
            ...overrides
        };
    }

    /**
     * @description Manager-level disconnect
     * Does not close an externally owned ioredis client; app owns Redis lifecycle
     */
    async disconnect(): Promise<void> {
        console.info('BullMQ manager disconnect (external Redis lifecycle unchanged)');
    }
}

/** Default shared BullMQ manager for queue, worker, and job services */
export const bullMQ = new BullMQManager();
