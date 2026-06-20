import { IBullMQWorkerOptions } from '../interface';
import { bullMQ, BullMQManager } from '../bullmq';
import { BullMQWorker } from './worker.bullmq';

/**
 * @description Worker service for managing multiple BullMQ workers
 * Provides centralized management for queue processors
 */
export class WorkerService {
    private readonly workers: BullMQWorker[] = [];

    /**
     * @description Optional default BullMQ manager when not passed per startWorker() call
     * @param {BullMQManager} defaultBullMq - Falls back to package singleton `bullMQ` when omitted
     */
    constructor(private readonly defaultBullMq?: BullMQManager) {}

    /**
     * @description Start a worker for the given queue
     * @param {IBullMQWorkerOptions} options - Queue name, processor, concurrency, optional `bullMq`
     */
    async startWorker(options: IBullMQWorkerOptions): Promise<void> {
        try {
            const manager = options.bullMq ?? this.defaultBullMq ?? bullMQ;
            const worker = new BullMQWorker({
                ...options,
                bullMq: manager
            });

            await worker.connect();
            await worker.registerEvents();
            this.workers.push(worker);

            console.info(`BullMQ Worker registered for queue: ${options.queueName}`);
        } catch (error: any) {
            console.error(`Error-- BullMQ Worker --msg :: `, error);
            throw error;
        }
    }

    /**
     * @description Stop all registered workers (does not close default Redis)
     */
    async stopWorkers(): Promise<void> {
        for (const worker of this.workers) {
            try {
                await worker.disconnect();
                console.info(`BullMQ Worker stopped :: ${worker.getQueueName()}`);
            } catch (error: any) {
                console.error(`Error stopping BullMQ Worker: `, error);
            }
        }
        this.workers.length = 0;
    }

    /** @alias stopWorkers */
    async disconnectWorkers(): Promise<void> {
        await this.stopWorkers();
    }

    /**
     * @description Number of active workers
     */
    getWorkerCount(): number {
        return this.workers.length;
    }

    /**
     * @description Queue names with active workers
     */
    getWorkerQueueNames(): string[] {
        return this.workers.map((w) => w.getQueueName());
    }
}

/** Pre-configured worker service singleton */
export const worker = new WorkerService();
