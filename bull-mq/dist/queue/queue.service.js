"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queue = exports.QueueService = void 0;
const manager_key_1 = require("../manager-key");
const bullmq_1 = require("../bullmq");
const queue_bullmq_1 = require("./queue.bullmq");
/**
 * @description Queue service for managing pooled BullMQ queue wrappers
 */
class QueueService {
    defaultBullMq;
    queues = new Map();
    /**
     * @description Optional default BullMQ manager when not passed per call
     * @param {BullMQManager} defaultBullMq - Falls back to package singleton `bullMQ` when omitted
     */
    constructor(defaultBullMq) {
        this.defaultBullMq = defaultBullMq;
    }
    /**
     * @description Resolve manager: per-call → service default → singleton
     */
    resolveManager(bullMq) {
        return bullMq ?? this.defaultBullMq ?? bullmq_1.bullMQ;
    }
    /**
     * @description Get or create a pooled queue wrapper for a queue name
     * @param {string} queueName - BullMQ queue name
     * @param {BullMQManager} bullMq - Optional manager override
     */
    async getQueue(queueName, bullMq) {
        const manager = this.resolveManager(bullMq);
        const key = `${(0, manager_key_1.getManagerPoolKey)(manager)}_${queueName}`;
        let wrapper = this.queues.get(key);
        if (!wrapper) {
            wrapper = new queue_bullmq_1.BullMQQueue({ queueName, bullMq: manager });
            await wrapper.connect();
            this.queues.set(key, wrapper);
        }
        return wrapper;
    }
    /**
     * @description Close all pooled queue instances (does not close default Redis)
     */
    async disconnectAll() {
        for (const [key, queueWrapper] of this.queues) {
            try {
                await queueWrapper.disconnect();
                console.info(`Disconnected queue wrapper: ${key}`);
            }
            catch (error) {
                console.error(`Error disconnecting queue ${key}:`, error);
            }
        }
        this.queues.clear();
    }
    /**
     * @description Number of pooled queue wrappers
     */
    getQueueCount() {
        return this.queues.size;
    }
    /**
     * @description Pooled queue keys
     */
    getQueueKeys() {
        return Array.from(this.queues.keys());
    }
}
exports.QueueService = QueueService;
/** Pre-configured queue service singleton */
exports.queue = new QueueService();
//# sourceMappingURL=queue.service.js.map