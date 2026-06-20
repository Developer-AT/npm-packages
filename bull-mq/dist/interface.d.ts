import type { ConnectionOptions as TlsConnectionOptions } from 'tls';
import type { JobsOptions, JobSchedulerTemplateOptions, Processor, QueueOptions, RepeatOptions, WorkerOptions } from 'bullmq';
import type { BullMQManager } from './bullmq';
export type REDIS_CLUSTER_TYPE = 'READ' | 'WRITE';
export interface IRedisConfig {
    readReplicaHost: string;
    readReplicaPort: number;
    writeReplicaHost: string;
    writeReplicaPort: number;
    password?: string;
    db?: number;
    isTlsEnabled?: boolean;
    tlsOptions?: TlsConnectionOptions;
}
export interface IBullMQQueueOptions {
    queueName: string;
    queueOptions?: Omit<QueueOptions, 'connection'>;
    /** Optional manager instance; defaults to package singleton `bullMQ` */
    bullMq?: BullMQManager;
}
export interface IBullMQWorkerOptions {
    queueName: string;
    processor: Processor;
    concurrency?: number;
    workerOptions?: Omit<WorkerOptions, 'connection'>;
    /** Optional manager instance; defaults to package singleton `bullMQ` */
    bullMq?: BullMQManager;
}
export interface IBullMQJobOptions {
    queueName: string;
    jobName: string;
    data: any;
    opts?: JobsOptions;
    /** Optional manager instance; defaults to package singleton `bullMQ` */
    bullMq?: BullMQManager;
}
export interface IBullMQBulkJob {
    name: string;
    data: any;
    opts?: JobsOptions;
}
export interface IBullMQSchedulerOptions {
    queueName: string;
    schedulerId: string;
    repeat: Omit<RepeatOptions, 'key'>;
    jobTemplate?: {
        name?: string;
        data?: any;
        opts?: JobSchedulerTemplateOptions;
    };
    /** Optional manager instance; defaults to package singleton `bullMQ` */
    bullMq?: BullMQManager;
}
export type { JobsOptions, JobSchedulerTemplateOptions, Processor, QueueOptions, RepeatOptions, WorkerOptions };
