"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagerPoolKey = getManagerPoolKey;
const bullmq_1 = require("./bullmq");
/**
 * @description Derive a stable pool key segment from a Redis connection
 */
function getConnectionKey(connection) {
    if (connection && typeof connection.options === 'object') {
        const opts = connection.options;
        return `${opts.host ?? 'localhost'}:${opts.port ?? 6379}:${opts.db ?? 0}`;
    }
    if (connection && typeof connection === 'object' && 'host' in connection) {
        const opts = connection;
        return `${opts.host ?? 'localhost'}:${opts.port ?? 6379}:${opts.db ?? 0}`;
    }
    return 'custom';
}
/**
 * @description Pool key prefix for grouping queues/workers/jobs by BullMQ manager instance
 */
function getManagerPoolKey(manager) {
    if (manager === bullmq_1.bullMQ) {
        return 'default';
    }
    if (manager.isConfigured()) {
        return getConnectionKey(manager.getConnectionOptions());
    }
    return 'custom';
}
//# sourceMappingURL=manager-key.js.map