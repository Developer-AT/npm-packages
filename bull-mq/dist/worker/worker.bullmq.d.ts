import { Worker } from 'bullmq';
import { IBullMQWorkerOptions } from '../interface';
import { BullMQManager } from '../bullmq';
/**
 * @description BullMQ worker wrapper
 * Composes a BullMQManager instance (default: package singleton `bullMQ`)
 */
export declare class BullMQWorker {
    private readonly bullMq;
    private readonly queueName;
    private readonly processor;
    private readonly concurrency?;
    private readonly workerOptions?;
    private worker;
    /**
     * @description Initialize worker wrapper
     * @param {IBullMQWorkerOptions} options - Queue name, processor, and optional manager
     */
    constructor(options: IBullMQWorkerOptions);
    /**
     * @description Start the BullMQ worker
     */
    connect(): Promise<Worker>;
    /**
     * @description Get underlying Worker (must be connected first)
     */
    getWorker(): Promise<Worker>;
    /**
     * @description Close worker (does not close default singleton Redis)
     */
    disconnect(): Promise<void>;
    /**
     * @description Register common worker event handlers
     */
    registerEvents(): Promise<void>;
    /**
     * @description Get the manager used by this worker
     */
    getBullMq(): BullMQManager;
    /**
     * @description Configured queue name
     */
    getQueueName(): string;
}
