import { RabbitMQManager } from './rabbitmq';
/**
 * @description Pool key prefix for grouping producers by RabbitMQ manager instance
 */
export declare function getManagerPoolKey(manager: RabbitMQManager): string;
/**
     * @description Fetches error message from error object
     * @param {any} error - Error object
     * @returns {string} Error message
     */
export declare function fetchErrorMessage(error: any): string | undefined;
