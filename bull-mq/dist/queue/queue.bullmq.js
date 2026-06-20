"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BullMQQueue = void 0;
const bullmq_1 = require("bullmq");
const bullmq_2 = require("../bullmq");
/**
 * @description BullMQ queue wrapper
 * Composes a BullMQManager instance (default: package singleton `bullMQ`)
 */
class BullMQQueue {
    bullMq;
    queueName;
    queueOptions;
    queue = null;
    /**
     * @description Initialize queue wrapper
     * @param {IBullMQQueueOptions} options - Queue name and optional manager / queue options
     */
    constructor(options) {
        this.bullMq = options.bullMq ?? bullmq_2.bullMQ;
        this.queueName = options.queueName;
        this.queueOptions = options.queueOptions;
    }
    /**
     * @description Create or return the underlying BullMQ Queue instance
     */
    async connect() {
        if (!this.queue) {
            this.queue = new bullmq_1.Queue(this.queueName, this.bullMq.getQueueOptions(this.queueOptions));
            console.info(`BullMQ Queue initialized :: ${this.queueName}`);
        }
        return this.queue;
    }
    /**
     * @description Get underlying Queue (must be connected first)
     */
    async getQueue() {
        return this.connect();
    }
    /**
     * @description Pause queue processing globally
     */
    async pause() {
        const queue = await this.getQueue();
        await queue.pause();
    }
    /**
     * @description Resume queue processing
     */
    async resume() {
        const queue = await this.getQueue();
        await queue.resume();
    }
    /**
     * @description Remove all jobs from the queue
     */
    async obliterate(force) {
        const queue = await this.getQueue();
        await queue.obliterate({ force });
    }
    /**
     * @description Close this queue instance (does not close default singleton Redis)
     */
    async disconnect() {
        if (this.queue) {
            await this.queue.close();
            this.queue = null;
            console.info(`BullMQ Queue closed :: ${this.queueName}`);
        }
    }
    /**
     * @description Get the manager used by this queue wrapper
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
exports.BullMQQueue = BullMQQueue;
//# sourceMappingURL=queue.bullmq.js.map