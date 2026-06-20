import { Worker } from 'bullmq';
import { IBullMQWorkerOptions } from '../interface';
import { bullMQ, BullMQManager } from '../bullmq';

/**
 * @description BullMQ worker wrapper
 * Composes a BullMQManager instance (default: package singleton `bullMQ`)
 */
export class BullMQWorker {
    private readonly bullMq: BullMQManager;
    private readonly queueName: string;
    private readonly processor: IBullMQWorkerOptions['processor'];
    private readonly concurrency?: number;
    private readonly workerOptions?: IBullMQWorkerOptions['workerOptions'];
    private worker: Worker | null = null;

    /**
     * @description Initialize worker wrapper
     * @param {IBullMQWorkerOptions} options - Queue name, processor, and optional manager
     */
    constructor(options: IBullMQWorkerOptions) {
        this.bullMq = options.bullMq ?? bullMQ;
        this.queueName = options.queueName;
        this.processor = options.processor;
        this.concurrency = options.concurrency;
        this.workerOptions = options.workerOptions;
    }

    /**
     * @description Start the BullMQ worker
     */
    async connect(): Promise<Worker> {
        if (!this.worker) {
            const opts = this.bullMq.getWorkerOptions({
                ...this.workerOptions,
                concurrency: this.concurrency ?? this.workerOptions?.concurrency
            });
            this.worker = new Worker(this.queueName, this.processor, opts);
            console.info(`BullMQ Worker started :: ${this.queueName}`);
        }
        return this.worker;
    }

    /**
     * @description Get underlying Worker (must be connected first)
     */
    async getWorker(): Promise<Worker> {
        return this.connect();
    }

    /**
     * @description Close worker (does not close default singleton Redis)
     */
    async disconnect(): Promise<void> {
        if (this.worker) {
            await this.worker.close();
            this.worker = null;
            console.info(`BullMQ Worker closed :: ${this.queueName}`);
        }
    }

    /**
     * @description Register common worker event handlers
     */
    async registerEvents(): Promise<void> {
        const worker = await this.getWorker();

        worker.on('error', (error: Error) => {
            console.error(`Error-- BullMQ Worker --msg :: `, error);
        });

        worker.on('failed', (job, error) => {
            console.error(`BullMQ Worker job failed :: ${job?.id}`, error);
        });

        worker.on('completed', (job) => {
            console.info(`BullMQ Worker job completed :: ${job.id}`);
        });
    }

    /**
     * @description Get the manager used by this worker
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
