import type { JobsOptions } from 'bullmq';
import { IBullMQBulkJob, IBullMQSchedulerOptions } from '../interface';
import { BullMQManager } from '../bullmq';
import { QueueService } from '../queue/queue.service';
/**
 * @description Job service for enqueueing and scheduling BullMQ jobs
 * High-level API similar to rabbit-mq producer service
 */
export declare class JobService {
    private readonly defaultBullMq?;
    private readonly queueService?;
    /**
     * @description Optional default BullMQ manager when not passed per call
     * @param {BullMQManager} defaultBullMq - Falls back to package singleton `bullMQ` when omitted
     * @param {QueueService} queueService - Optional queue pool (for shared queue instances)
     */
    constructor(defaultBullMq?: BullMQManager | undefined, queueService?: QueueService | undefined);
    private resolveManager;
    private getJobHelper;
    /**
     * @description Add a job to a queue
     * @param {string} queueName - Target queue
     * @param {string} jobName - Job name
     * @param {any} data - Job payload
     * @param {JobsOptions} opts - Optional delay, attempts, etc.
     * @param {BullMQManager} bullMq - Optional manager override
     */
    add(queueName: string, jobName: string, data: any, opts?: JobsOptions, bullMq?: BullMQManager): Promise<import("bullmq").Job<any, any, string>>;
    /**
     * @description Add multiple jobs to a queue
     */
    addBulk(queueName: string, jobs: IBullMQBulkJob[], bullMq?: BullMQManager): Promise<import("bullmq").Job<any, any, string>[]>;
    /**
     * @description Schedule a repeatable job via upsertJobScheduler
     * @param {string} queueName - Target queue
     * @param {string} schedulerId - Unique scheduler id
     * @param {IBullMQSchedulerOptions['repeat']} repeat - Cron / every / pattern options
     * @param {IBullMQSchedulerOptions['jobTemplate']} jobTemplate - Job name, data, opts template
     * @param {BullMQManager} bullMq - Optional manager override
     */
    schedule(queueName: string, schedulerId: string, repeat: IBullMQSchedulerOptions['repeat'], jobTemplate?: IBullMQSchedulerOptions['jobTemplate'], bullMq?: BullMQManager): Promise<import("bullmq").Job<any, any, string>>;
    /**
     * @description Remove a job scheduler
     */
    removeSchedule(queueName: string, schedulerId: string, bullMq?: BullMQManager): Promise<boolean>;
    /**
     * @description Get a job by id
     */
    getJob(queueName: string, jobId: string, bullMq?: BullMQManager): Promise<import("bullmq").Job<any, any, string> | undefined>;
}
/** Pre-configured job service singleton (uses pooled queue service) */
export declare const job: JobService;
