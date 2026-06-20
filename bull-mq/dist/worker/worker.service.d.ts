import { IBullMQWorkerOptions } from '../interface';
import { BullMQManager } from '../bullmq';
/**
 * @description Worker service for managing multiple BullMQ workers
 * Provides centralized management for queue processors
 */
export declare class WorkerService {
    private readonly defaultBullMq?;
    private readonly workers;
    /**
     * @description Optional default BullMQ manager when not passed per startWorker() call
     * @param {BullMQManager} defaultBullMq - Falls back to package singleton `bullMQ` when omitted
     */
    constructor(defaultBullMq?: BullMQManager | undefined);
    /**
     * @description Start a worker for the given queue
     * @param {IBullMQWorkerOptions} options - Queue name, processor, concurrency, optional `bullMq`
     */
    startWorker(options: IBullMQWorkerOptions): Promise<void>;
    /**
     * @description Stop all registered workers (does not close default Redis)
     */
    stopWorkers(): Promise<void>;
    /** @alias stopWorkers */
    disconnectWorkers(): Promise<void>;
    /**
     * @description Number of active workers
     */
    getWorkerCount(): number;
    /**
     * @description Queue names with active workers
     */
    getWorkerQueueNames(): string[];
}
/** Pre-configured worker service singleton */
export declare const worker: WorkerService;
