import type { JobsOptions } from 'bullmq';
import { IBullMQBulkJob, IBullMQSchedulerOptions } from '../interface';
import { BullMQManager } from '../bullmq';
import { BullMQQueue } from '../queue/queue.bullmq';
/**
 * @description BullMQ job helper bound to a queue name and manager
 * Wraps add, bulk add, and job scheduler operations
 */
export declare class BullMQJob {
    private readonly queueWrapper;
    /**
     * @description Initialize job helper for a queue
     */
    constructor(options: {
        queueName: string;
        bullMq?: BullMQManager;
        queueWrapper?: BullMQQueue;
    });
    /**
     * @description Add a single job to the queue
     */
    add(jobName: string, data: any, opts?: JobsOptions): Promise<import("bullmq").Job<any, any, string>>;
    /**
     * @description Add multiple jobs in bulk
     */
    addBulk(jobs: IBullMQBulkJob[]): Promise<import("bullmq").Job<any, any, string>[]>;
    /**
     * @description Create or update a repeatable job scheduler
     */
    upsertScheduler(schedulerId: string, repeat: IBullMQSchedulerOptions['repeat'], jobTemplate?: IBullMQSchedulerOptions['jobTemplate']): Promise<import("bullmq").Job<any, any, string>>;
    /**
     * @description Remove a job scheduler by id
     */
    removeScheduler(schedulerId: string): Promise<boolean>;
    /**
     * @description Fetch a job by id
     */
    getJob(jobId: string): Promise<import("bullmq").Job<any, any, string> | undefined>;
    /**
     * @description Close the underlying queue wrapper
     */
    disconnect(): Promise<void>;
}
