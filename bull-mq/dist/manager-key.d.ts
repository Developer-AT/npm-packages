import { BullMQManager } from './bullmq';
/**
 * @description Pool key prefix for grouping queues/workers/jobs by BullMQ manager instance
 */
export declare function getManagerPoolKey(manager: BullMQManager): string;
