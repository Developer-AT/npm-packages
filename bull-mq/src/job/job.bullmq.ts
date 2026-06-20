import type { JobsOptions } from 'bullmq';
import { IBullMQBulkJob, IBullMQSchedulerOptions } from '../interface';
import { bullMQ, BullMQManager } from '../bullmq';
import { BullMQQueue } from '../queue/queue.bullmq';

/**
 * @description BullMQ job helper bound to a queue name and manager
 * Wraps add, bulk add, and job scheduler operations
 */
export class BullMQJob {
    private readonly queueWrapper: BullMQQueue;

    /**
     * @description Initialize job helper for a queue
     */
    constructor(options: { queueName: string; bullMq?: BullMQManager; queueWrapper?: BullMQQueue }) {
        this.queueWrapper =
            options.queueWrapper ??
            new BullMQQueue({
                queueName: options.queueName,
                bullMq: options.bullMq ?? bullMQ
            });
    }

    /**
     * @description Add a single job to the queue
     */
    async add(jobName: string, data: any, opts?: JobsOptions) {
        const queue = await this.queueWrapper.getQueue();
        return queue.add(jobName, data, opts);
    }

    /**
     * @description Add multiple jobs in bulk
     */
    async addBulk(jobs: IBullMQBulkJob[]) {
        const queue = await this.queueWrapper.getQueue();
        return queue.addBulk(jobs);
    }

    /**
     * @description Create or update a repeatable job scheduler
     */
    async upsertScheduler(
        schedulerId: string,
        repeat: IBullMQSchedulerOptions['repeat'],
        jobTemplate?: IBullMQSchedulerOptions['jobTemplate']
    ) {
        const queue = await this.queueWrapper.getQueue();
        return queue.upsertJobScheduler(schedulerId, repeat, jobTemplate);
    }

    /**
     * @description Remove a job scheduler by id
     */
    async removeScheduler(schedulerId: string) {
        const queue = await this.queueWrapper.getQueue();
        return queue.removeJobScheduler(schedulerId);
    }

    /**
     * @description Fetch a job by id
     */
    async getJob(jobId: string) {
        const queue = await this.queueWrapper.getQueue();
        return queue.getJob(jobId);
    }

    /**
     * @description Close the underlying queue wrapper
     */
    async disconnect(): Promise<void> {
        await this.queueWrapper.disconnect();
    }
}
