"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BullMQJob = void 0;
const bullmq_1 = require("../bullmq");
const queue_bullmq_1 = require("../queue/queue.bullmq");
/**
 * @description BullMQ job helper bound to a queue name and manager
 * Wraps add, bulk add, and job scheduler operations
 */
class BullMQJob {
    queueWrapper;
    /**
     * @description Initialize job helper for a queue
     */
    constructor(options) {
        this.queueWrapper =
            options.queueWrapper ??
                new queue_bullmq_1.BullMQQueue({
                    queueName: options.queueName,
                    bullMq: options.bullMq ?? bullmq_1.bullMQ
                });
    }
    /**
     * @description Add a single job to the queue
     */
    async add(jobName, data, opts) {
        const queue = await this.queueWrapper.getQueue();
        return queue.add(jobName, data, opts);
    }
    /**
     * @description Add multiple jobs in bulk
     */
    async addBulk(jobs) {
        const queue = await this.queueWrapper.getQueue();
        return queue.addBulk(jobs);
    }
    /**
     * @description Create or update a repeatable job scheduler
     */
    async upsertScheduler(schedulerId, repeat, jobTemplate) {
        const queue = await this.queueWrapper.getQueue();
        return queue.upsertJobScheduler(schedulerId, repeat, jobTemplate);
    }
    /**
     * @description Remove a job scheduler by id
     */
    async removeScheduler(schedulerId) {
        const queue = await this.queueWrapper.getQueue();
        return queue.removeJobScheduler(schedulerId);
    }
    /**
     * @description Fetch a job by id
     */
    async getJob(jobId) {
        const queue = await this.queueWrapper.getQueue();
        return queue.getJob(jobId);
    }
    /**
     * @description Close the underlying queue wrapper
     */
    async disconnect() {
        await this.queueWrapper.disconnect();
    }
}
exports.BullMQJob = BullMQJob;
//# sourceMappingURL=job.bullmq.js.map