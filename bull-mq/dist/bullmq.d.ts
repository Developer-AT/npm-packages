import type { ConnectionOptions, JobsOptions, QueueOptions, WorkerOptions } from 'bullmq';
import type { IRedisConfig } from './interface';
/**
 * @description BullMQ manager — holds injected Redis connection and shared defaults
 * Does not create Queue/Worker instances; wrappers compose this manager
 */
export declare class BullMQManager {
    private connection;
    private prefix?;
    private defaultJobOptions?;
    /**
     * @description Set Redis connection for this manager instance (ioredis client or RedisOptions)
     * @param {ConnectionOptions} connection - Injected Redis connection from the host application
     */
    setConnection(connection: ConnectionOptions): void;
    /**
     * @description Initialize Redis from package connection module and bind write client to this manager
     * @param {IRedisConfig} config - Read/write replica Redis configuration
     */
    initFromRedisConfig(config: IRedisConfig): void;
    /**
     * @description Optional key prefix for all BullMQ queues on this manager
     * @param {string} prefix - BullMQ prefix (e.g. `{app}`)
     */
    setPrefix(prefix: string): void;
    /**
     * @description Default job options applied when merging queue options
     * @param {JobsOptions} opts - Default job options
     */
    setDefaultJobOptions(opts: JobsOptions): void;
    /**
     * @description Whether setConnection has been called on this instance
     */
    isConfigured(): boolean;
    /**
     * @description Returns the configured Redis connection
     */
    getConnectionOptions(): ConnectionOptions;
    /**
     * @description Build QueueOptions by merging manager defaults with overrides
     * @param {Omit<QueueOptions, 'connection'>} overrides - Per-queue options (without connection)
     */
    getQueueOptions(overrides?: Omit<QueueOptions, 'connection'>): QueueOptions;
    /**
     * @description Build WorkerOptions by merging manager defaults with overrides
     * @param {Omit<WorkerOptions, 'connection'>} overrides - Per-worker options (without connection)
     */
    getWorkerOptions(overrides?: Omit<WorkerOptions, 'connection'>): WorkerOptions;
    /**
     * @description Manager-level disconnect
     * Does not close an externally owned ioredis client; app owns Redis lifecycle
     */
    disconnect(): Promise<void>;
}
/** Default shared BullMQ manager for queue, worker, and job services */
export declare const bullMQ: BullMQManager;
