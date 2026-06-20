"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.job = exports.JobService = void 0;
const bullmq_1 = require("../bullmq");
const queue_service_1 = require("../queue/queue.service");
const job_bullmq_1 = require("./job.bullmq");
/**
 * @description Job service for enqueueing and scheduling BullMQ jobs
 * High-level API similar to rabbit-mq producer service
 */
class JobService {
    defaultBullMq;
    queueService;
    /**
     * @description Optional default BullMQ manager when not passed per call
     * @param {BullMQManager} defaultBullMq - Falls back to package singleton `bullMQ` when omitted
     * @param {QueueService} queueService - Optional queue pool (for shared queue instances)
     */
    constructor(defaultBullMq, queueService) {
        this.defaultBullMq = defaultBullMq;
        this.queueService = queueService;
    }
    resolveManager(bullMq) {
        return bullMq ?? this.defaultBullMq ?? bullmq_1.bullMQ;
    }
    async getJobHelper(queueName, bullMq) {
        const manager = this.resolveManager(bullMq);
        if (this.queueService) {
            const wrapper = await this.queueService.getQueue(queueName, manager);
            return new job_bullmq_1.BullMQJob({ queueName, queueWrapper: wrapper });
        }
        return new job_bullmq_1.BullMQJob({ queueName, bullMq: manager });
    }
    /**
     * @description Add a job to a queue
     * @param {string} queueName - Target queue
     * @param {string} jobName - Job name
     * @param {any} data - Job payload
     * @param {JobsOptions} opts - Optional delay, attempts, etc.
     * @param {BullMQManager} bullMq - Optional manager override
     */
    async add(queueName, jobName, data, opts, bullMq) {
        try {
            const helper = await this.getJobHelper(queueName, bullMq);
            const job = await helper.add(jobName, data, opts);
            console.info(`BullMQ Job added :: ${queueName} / ${jobName}`);
            return job;
        }
        catch (error) {
            console.error(`Error-- BullMQ Job add --msg :: `, error);
            throw error;
        }
    }
    /**
     * @description Add multiple jobs to a queue
     */
    async addBulk(queueName, jobs, bullMq) {
        try {
            const helper = await this.getJobHelper(queueName, bullMq);
            return await helper.addBulk(jobs);
        }
        catch (error) {
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
    async schedule(queueName, schedulerId, repeat, jobTemplate, bullMq) {
        try {
            const helper = await this.getJobHelper(queueName, bullMq);
            const job = await helper.upsertScheduler(schedulerId, repeat, jobTemplate);
            console.info(`BullMQ Job scheduler upserted :: ${queueName} / ${schedulerId}`);
            return job;
        }
        catch (error) {
            console.error(`Error-- BullMQ Job schedule --msg :: `, error);
            throw error;
        }
    }
    /**
     * @description Remove a job scheduler
     */
    async removeSchedule(queueName, schedulerId, bullMq) {
        const helper = await this.getJobHelper(queueName, bullMq);
        return helper.removeScheduler(schedulerId);
    }
    /**
     * @description Get a job by id
     */
    async getJob(queueName, jobId, bullMq) {
        const helper = await this.getJobHelper(queueName, bullMq);
        return helper.getJob(jobId);
    }
}
exports.JobService = JobService;
/** Pre-configured job service singleton (uses pooled queue service) */
exports.job = new JobService(undefined, queue_service_1.queue);
//# sourceMappingURL=job.service.js.map