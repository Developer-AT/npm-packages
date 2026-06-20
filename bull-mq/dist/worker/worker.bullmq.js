"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BullMQWorker = void 0;
const bullmq_1 = require("bullmq");
const bullmq_2 = require("../bullmq");
/**
 * @description BullMQ worker wrapper
 * Composes a BullMQManager instance (default: package singleton `bullMQ`)
 */
class BullMQWorker {
    bullMq;
    queueName;
    processor;
    concurrency;
    workerOptions;
    worker = null;
    /**
     * @description Initialize worker wrapper
     * @param {IBullMQWorkerOptions} options - Queue name, processor, and optional manager
     */
    constructor(options) {
        this.bullMq = options.bullMq ?? bullmq_2.bullMQ;
        this.queueName = options.queueName;
        this.processor = options.processor;
        this.concurrency = options.concurrency;
        this.workerOptions = options.workerOptions;
    }
    /**
     * @description Start the BullMQ worker
     */
    async connect() {
        if (!this.worker) {
            const opts = this.bullMq.getWorkerOptions({
                ...this.workerOptions,
                concurrency: this.concurrency ?? this.workerOptions?.concurrency
            });
            this.worker = new bullmq_1.Worker(this.queueName, this.processor, opts);
            console.info(`BullMQ Worker started :: ${this.queueName}`);
        }
        return this.worker;
    }
    /**
     * @description Get underlying Worker (must be connected first)
     */
    async getWorker() {
        return this.connect();
    }
    /**
     * @description Close worker (does not close default singleton Redis)
     */
    async disconnect() {
        if (this.worker) {
            await this.worker.close();
            this.worker = null;
            console.info(`BullMQ Worker closed :: ${this.queueName}`);
        }
    }
    /**
     * @description Register common worker event handlers
     */
    async registerEvents() {
        const worker = await this.getWorker();
        worker.on('error', (error) => {
            console.error(`Error-- BullMQ Worker --msg :: `, error);
        });
        worker.on('failed', (job, error) => {
            console.error(`BullMQ Worker job failed :: ${job?.id}`, error);
        });
        worker.on('completed', (job) => {
            console.info(`BullMQ Worker job completed :: ${job.id}`);
        });
    }
    /**
     * @description Get the manager used by this worker
     */
    getBullMq() {
        return this.bullMq;
    }
    /**
     * @description Configured queue name
     */
    getQueueName() {
        return this.queueName;
    }
}
exports.BullMQWorker = BullMQWorker;
//# sourceMappingURL=worker.bullmq.js.map