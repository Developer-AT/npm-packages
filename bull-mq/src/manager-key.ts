import type { ConnectionOptions } from 'bullmq';
import { bullMQ, BullMQManager } from './bullmq';

/**
 * @description Derive a stable pool key segment from a Redis connection
 */
function getConnectionKey(connection: ConnectionOptions): string {
    if (connection && typeof (connection as { options?: { host?: string; port?: number; db?: number } }).options === 'object') {
        const opts = (connection as { options: { host?: string; port?: number; db?: number } }).options;
        return `${opts.host ?? 'localhost'}:${opts.port ?? 6379}:${opts.db ?? 0}`;
    }

    if (connection && typeof connection === 'object' && 'host' in connection) {
        const opts = connection as { host?: string; port?: number; db?: number };
        return `${opts.host ?? 'localhost'}:${opts.port ?? 6379}:${opts.db ?? 0}`;
    }

    return 'custom';
}

/**
 * @description Pool key prefix for grouping queues/workers/jobs by BullMQ manager instance
 */
export function getManagerPoolKey(manager: BullMQManager): string {
    if (manager === bullMQ) {
        return 'default';
    }

    if (manager.isConfigured()) {
        return getConnectionKey(manager.getConnectionOptions());
    }

    return 'custom';
}
