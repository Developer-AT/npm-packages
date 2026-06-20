import type { JobsOptions } from 'bullmq';
import { IBullMQBulkJob, IBullMQSchedulerOptions } from '../interface';
import { bullMQ, BullMQManager } from '../bullmq';
import { QueueService, queue } from '../queue/queue.service';
import { BullMQJob } from './job.bullmq';

/**
 * @description Job service for enqueueing and scheduling BullMQ jobs
 * High-level API similar to rabbit-mq producer service
 */
export class JobService {
    /**
     * @description Optional default BullMQ manager when not passed per call
     * @param {BullMQManager} defaultBullMq - Falls back to package singleton `bullMQ` when omitted
     * @param {QueueService} queueService - Optional queue pool (for shared queue instances)
     */
    constructor(
        private readonly defaultBullMq?: BullMQManager,
        private readonly queueService?: QueueService
    ) {}

    private resolveManager(bullMq?: BullMQManager): BullMQManager {
        return bullMq ?? this.defaultBullMq ?? bullMQ;
    }

    private async getJobHelper(queueName: string, bullMq?: BullMQManager): Promise<BullMQJob> {
        const manager = this.resolveManager(bullMq);

        if (this.queueService) {
            const wrapper = await this.queueService.getQueue(queueName, manager);
            return new BullMQJob({ queueName, queueWrapper: wrapper });
        }

        return new BullMQJob({ queueName, bullMq: manager });
    }

    /**
     * @description Add a job to a queue
     * @param {string} queueName - Target queue
     * @param {string} jobName - Job name
     * @param {any} data - Job payload
     * @param {JobsOptions} opts - Optional delay, attempts, etc.
     * @param {BullMQManager} bullMq - Optional manager override
     */
    async add(
        queueName: string,
        jobName: string,
        data: any,
        opts?: JobsOptions,
        bullMq?: BullMQManager
    ) {
        try {
            const helper = await this.getJobHelper(queueName, bullMq);
            const job = await helper.add(jobName, data, opts);
            console.info(`BullMQ Job added :: ${queueName} / ${jobName}`);
            return job;
        } catch (error: any) {
            console.error(`Error-- BullMQ Job add --msg :: `, error);
            throw error;
        }
    }

    /**
     * @description Add multiple jobs to a queue
     */
    async addBulk(queueName: string, jobs: IBullMQBulkJob[], bullMq?: BullMQManager) {
        try {
            const helper = await this.getJobHelper(queueName, bullMq);
            return await helper.addBulk(jobs);
        } catch (error: any) {
            console.error(`Error-- BullMQ Job addBulk --msg :: `, error);
            throw error;
        }
    }

    /**
     * @description Schedule a repeatable job via upsertJobScheduler
     * @param {string} queueName - Target queue
     * @param {string} schedulerId - Unique scheduler id
     * @param {IBullMQSchedulerOptions['repeat']} repeat - Cron / every / pattern options
     * @param {IBullMQSchedulerOptions['jobTemplate']} jobTemplate - Job name, data, opts template
     * @param {BullMQManager} bullMq - Optional manager override
     */
    async schedule(
        queueName: string,
        schedulerId: string,
        repeat: IBullMQSchedulerOptions['repeat'],
        jobTemplate?: IBullMQSchedulerOptions['jobTemplate'],
        bullMq?: BullMQManager
    ) {
        try {
            const helper = await this.getJobHelper(queueName, bullMq);
            const job = await helper.upsertScheduler(schedulerId, repeat, jobTemplate);
            console.info(`BullMQ Job scheduler upserted :: ${queueName} / ${schedulerId}`);
            return job;
        } catch (error: any) {
            console.error(`Error-- BullMQ Job schedule --msg :: `, error);
            throw error;
        }
    }

    /**
     * @description Remove a job scheduler
     */
    async removeSchedule(queueName: string, schedulerId: string, bullMq?: BullMQManager) {
        const helper = await this.getJobHelper(queueName, bullMq);
        return helper.removeScheduler(schedulerId);
    }

    /**
     * @description Get a job by id
     */
    async getJob(queueName: string, jobId: string, bullMq?: BullMQManager) {
        const helper = await this.getJobHelper(queueName, bullMq);
        return helper.getJob(jobId);
    }
}

/** Pre-configured job service singleton (uses pooled queue service) */
export const job = new JobService(undefined, queue);
