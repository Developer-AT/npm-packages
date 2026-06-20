"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagerPoolKey = getManagerPoolKey;
exports.fetchErrorMessage = fetchErrorMessage;
const rabbitmq_1 = require("./rabbitmq");
/**
 * @description Pool key prefix for grouping producers by RabbitMQ manager instance
 */
function getManagerPoolKey(manager) {
    if (manager === rabbitmq_1.rabbitMQ) {
        return 'default';
    }
    return manager.getUrl() ?? 'custom';
}
/**
     * @description Fetches error message from error object
     * @param {any} error - Error object
     * @returns {string} Error message
     */
function fetchErrorMessage(error) {
    return error?.message || error?.data?.message;
}
//# sourceMappingURL=manager-key.js.map