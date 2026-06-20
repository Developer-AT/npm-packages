import { Queue } from 'bullmq';
import { IBullMQQueueOptions } from '../interface';
import { BullMQManager } from '../bullmq';
/**
 * @description BullMQ queue wrapper
 * Composes a BullMQManager instance (default: package singleton `bullMQ`)
 */
export declare class BullMQQueue {
    private readonly bullMq;
    private readonly queueName;
    private readonly queueOptions?;
    private queue;
    /**
     * @description Initialize queue wrapper
     * @param {IBullMQQueueOptions} options - Queue name and optional manager / queue options
     */
    constructor(options: IBullMQQueueOptions);
    /**
     * @description Create or return the underlying BullMQ Queue instance
     */
    connect(): Promise<Queue>;
    /**
     * @description Get underlying Queue (must be connected first)
     */
    getQueue(): Promise<Queue>;
    /**
     * @description Pause queue processing globally
     */
    pause(): Promise<void>;
    /**
     * @description Resume queue processing
     */
    resume(): Promise<void>;
    /**
     * @description Remove all jobs from the queue
     */
    obliterate(force?: boolean): Promise<void>;
    /**
     * @description Close this queue instance (does not close default singleton Redis)
     */
    disconnect(): Promise<void>;
    /**
     * @description Get the manager used by this queue wrapper
     */
    getBullMq(): BullMQManager;
    /**
     * @description Configured queue name
     */
    getQueueName(): string;
}
