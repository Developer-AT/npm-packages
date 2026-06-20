import { Queue } from 'bullmq';
import { IBullMQQueueOptions } from '../interface';
import { bullMQ, BullMQManager } from '../bullmq';

/**
 * @description BullMQ queue wrapper
 * Composes a BullMQManager instance (default: package singleton `bullMQ`)
 */
export class BullMQQueue {
    private readonly bullMq: BullMQManager;
    private readonly queueName: string;
    private readonly queueOptions?: IBullMQQueueOptions['queueOptions'];
    private queue: Queue | null = null;

    /**
     * @description Initialize queue wrapper
     * @param {IBullMQQueueOptions} options - Queue name and optional manager / queue options
     */
    constructor(options: IBullMQQueueOptions) {
        this.bullMq = options.bullMq ?? bullMQ;
        this.queueName = options.queueName;
        this.queueOptions = options.queueOptions;
    }

    /**
     * @description Create or return the underlying BullMQ Queue instance
     */
    async connect(): Promise<Queue> {
        if (!this.queue) {
            this.queue = new Queue(this.queueName, this.bullMq.getQueueOptions(this.queueOptions));
            console.info(`BullMQ Queue initialized :: ${this.queueName}`);
        }
        return this.queue;
    }

    /**
     * @description Get underlying Queue (must be connected first)
     */
    async getQueue(): Promise<Queue> {
        return this.connect();
    }

    /**
     * @description Pause queue processing globally
     */
    async pause(): Promise<void> {
        const queue = await this.getQueue();
        await queue.pause();
    }

    /**
     * @description Resume queue processing
     */
    async resume(): Promise<void> {
        const queue = await this.getQueue();
        await queue.resume();
    }

    /**
     * @description Remove all jobs from the queue
     */
    async obliterate(force?: boolean): Promise<void> {
        const queue = await this.getQueue();
        await queue.obliterate({ force });
    }

    /**
     * @description Close this queue instance (does not close default singleton Redis)
     */
    async disconnect(): Promise<void> {
        if (this.queue) {
            await this.queue.close();
            this.queue = null;
            console.info(`BullMQ Queue closed :: ${this.queueName}`);
        }
    }

    /**
     * @description Get the manager used by this queue wrapper
     */
    getBullMq(): BullMQManager {
        return this.bullMq;
    }

    /**
     * @description Configured queue name
     */
    getQueueName(): string {
        return this.queueName;
    }
}
