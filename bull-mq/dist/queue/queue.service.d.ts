import { BullMQManager } from '../bullmq';
import { BullMQQueue } from './queue.bullmq';
/**
 * @description Queue service for managing pooled BullMQ queue wrappers
 */
export declare class QueueService {
    private readonly defaultBullMq?;
    private readonly queues;
    /**
     * @description Optional default BullMQ manager when not passed per call
     * @param {BullMQManager} defaultBullMq - Falls back to package singleton `bullMQ` when omitted
     */
    constructor(defaultBullMq?: BullMQManager | undefined);
    /**
     * @description Resolve manager: per-call → service default → singleton
     */
    private resolveManager;
    /**
     * @description Get or create a pooled queue wrapper for a queue name
     * @param {string} queueName - BullMQ queue name
     * @param {BullMQManager} bullMq - Optional manager override
     */
    getQueue(queueName: string, bullMq?: BullMQManager): Promise<BullMQQueue>;
    /**
     * @description Close all pooled queue instances (does not close default Redis)
     */
    disconnectAll(): Promise<void>;
    /**
     * @description Number of pooled queue wrappers
     */
    getQueueCount(): number;
    /**
     * @description Pooled queue keys
     */
    getQueueKeys(): string[];
}
/** Pre-configured queue service singleton */
export declare const queue: QueueService;
