"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.worker = exports.WorkerService = void 0;
const bullmq_1 = require("../bullmq");
const worker_bullmq_1 = require("./worker.bullmq");
/**
 * @description Worker service for managing multiple BullMQ workers
 * Provides centralized management for queue processors
 */
class WorkerService {
    defaultBullMq;
    workers = [];
    /**
     * @description Optional default BullMQ manager when not passed per startWorker() call
     * @param {BullMQManager} defaultBullMq - Falls back to package singleton `bullMQ` when omitted
     */
    constructor(defaultBullMq) {
        this.defaultBullMq = defaultBullMq;
    }
    /**
     * @description Start a worker for the given queue
     * @param {IBullMQWorkerOptions} options - Queue name, processor, concurrency, optional `bullMq`
     */
    async startWorker(options) {
        try {
            const manager = options.bullMq ?? this.defaultBullMq ?? bullmq_1.bullMQ;
            const worker = new worker_bullmq_1.BullMQWorker({
                ...options,
                bullMq: manager
            });
            await worker.connect();
            await worker.registerEvents();
            this.workers.push(worker);
            console.info(`BullMQ Worker registered for queue: ${options.queueName}`);
        }
        catch (error) {
            console.error(`Error-- BullMQ Worker --msg :: `, error);
            throw error;
        }
    }
    /**
     * @description Stop all registered workers (does not close default Redis)
     */
    async stopWorkers() {
        for (const worker of this.workers) {
            try {
                await worker.disconnect();
                console.info(`BullMQ Worker stopped :: ${worker.getQueueName()}`);
            }
            catch (error) {
                console.error(`Error stopping BullMQ Worker: `, error);
            }
        }
        this.workers.length = 0;
    }
    /** @alias stopWorkers */
    async disconnectWorkers() {
        await this.stopWorkers();
    }
    /**
     * @description Number of active workers
     */
    getWorkerCount() {
        return this.workers.length;
    }
    /**
     * @description Queue names with active workers
     */
    getWorkerQueueNames() {
        return this.workers.map((w) => w.getQueueName());
    }
}
exports.WorkerService = WorkerService;
/** Pre-configured worker service singleton */
exports.worker = new WorkerService();
//# sourceMappingURL=worker.service.js.map