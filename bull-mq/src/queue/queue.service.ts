import { getManagerPoolKey } from '../manager-key';
import { bullMQ, BullMQManager } from '../bullmq';
import { BullMQQueue } from './queue.bullmq';

/**
 * @description Queue service for managing pooled BullMQ queue wrappers
 */
export class QueueService {
    private readonly queues = new Map<string, BullMQQueue>();

    /**
     * @description Optional default BullMQ manager when not passed per call
     * @param {BullMQManager} defaultBullMq - Falls back to package singleton `bullMQ` when omitted
     */
    constructor(private readonly defaultBullMq?: BullMQManager) {}

    /**
     * @description Resolve manager: per-call → service default → singleton
     */
    private resolveManager(bullMq?: BullMQManager): BullMQManager {
        return bullMq ?? this.defaultBullMq ?? bullMQ;
    }

    /**
     * @description Get or create a pooled queue wrapper for a queue name
     * @param {string} queueName - BullMQ queue name
     * @param {BullMQManager} bullMq - Optional manager override
     */
    async getQueue(queueName: string, bullMq?: BullMQManager): Promise<BullMQQueue> {
        const manager = this.resolveManager(bullMq);
        const key = `${getManagerPoolKey(manager)}_${queueName}`;
        let wrapper = this.queues.get(key);

        if (!wrapper) {
            wrapper = new BullMQQueue({ queueName, bullMq: manager });
            await wrapper.connect();
            this.queues.set(key, wrapper);
        }

        return wrapper;
    }

    /**
     * @description Close all pooled queue instances (does not close default Redis)
     */
    async disconnectAll(): Promise<void> {
        for (const [key, queueWrapper] of this.queues) {
            try {
                await queueWrapper.disconnect();
                console.info(`Disconnected queue wrapper: ${key}`);
            } catch (error: any) {
                console.error(`Error disconnecting queue ${key}:`, error);
            }
        }
        this.queues.clear();
    }

    /**
     * @description Number of pooled queue wrappers
     */
    getQueueCount(): number {
        return this.queues.size;
    }

    /**
     * @description Pooled queue keys
     */
    getQueueKeys(): string[] {
        return Array.from(this.queues.keys());
    }
}

/** Pre-configured queue service singleton */
export const queue = new QueueService();
