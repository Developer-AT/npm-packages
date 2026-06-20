"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bullMQ = exports.BullMQManager = void 0;
const connection_1 = require("./connection");
/**
 * @description BullMQ manager — holds injected Redis connection and shared defaults
 * Does not create Queue/Worker instances; wrappers compose this manager
 */
class BullMQManager {
    connection = null;
    prefix;
    defaultJobOptions;
    /**
     * @description Set Redis connection for this manager instance (ioredis client or RedisOptions)
     * @param {ConnectionOptions} connection - Injected Redis connection from the host application
     */
    setConnection(connection) {
        this.connection = connection;
    }
    /**
     * @description Initialize Redis from package connection module and bind write client to this manager
     * @param {IRedisConfig} config - Read/write replica Redis configuration
     */
    initFromRedisConfig(config) {
        connection_1.redisConnection.initiateRedisConnection(config);
        this.setConnection(connection_1.redisConnection.getWriteClient());
    }
    /**
     * @description Optional key prefix for all BullMQ queues on this manager
     * @param {string} prefix - BullMQ prefix (e.g. `{app}`)
     */
    setPrefix(prefix) {
        this.prefix = prefix;
    }
    /**
     * @description Default job options applied when merging queue options
     * @param {JobsOptions} opts - Default job options
     */
    setDefaultJobOptions(opts) {
        this.defaultJobOptions = opts;
    }
    /**
     * @description Whether setConnection has been called on this instance
     */
    isConfigured() {
        return this.connection !== null;
    }
    /**
     * @description Returns the configured Redis connection
     */
    getConnectionOptions() {
        if (!this.connection) {
            throw new Error('BullMQ is not configured. Call setConnection(redis) on this BullMQManager instance first.');
        }
        return this.connection;
    }
    /**
     * @description Build QueueOptions by merging manager defaults with overrides
     * @param {Omit<QueueOptions, 'connection'>} overrides - Per-queue options (without connection)
     */
    getQueueOptions(overrides) {
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
    getWorkerOptions(overrides) {
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
    async disconnect() {
        console.info('BullMQ manager disconnect (external Redis lifecycle unchanged)');
    }
}
exports.BullMQManager = BullMQManager;
/** Default shared BullMQ manager for queue, worker, and job services */
exports.bullMQ = new BullMQManager();
//# sourceMappingURL=bullmq.js.map