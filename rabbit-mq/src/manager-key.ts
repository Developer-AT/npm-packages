import { rabbitMQ, RabbitMQManager } from './rabbitmq';

/**
 * @description Pool key prefix for grouping producers by RabbitMQ manager instance
 */
export function getManagerPoolKey(manager: RabbitMQManager): string {
    if (manager === rabbitMQ) {
        return 'default';
    }
    return manager.getUrl() ?? 'custom';
}


/**
     * @description Fetches error message from error object
     * @param {any} error - Error object
     * @returns {string} Error message
     */
export function fetchErrorMessage(error: any): string | undefined {
    return error?.message || error?.data?.message;
}