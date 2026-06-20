import { IRabbitMQConsumerOptions } from '../interface';
import { RabbitMQManager } from '../rabbitmq';
/**
 * @description Consumer service for managing multiple RabbitMQ consumers
 * Provides centralized management for multiple queue consumers
 */
export declare class ConsumerService {
    private readonly defaultRabbitMq?;
    private readonly consumers;
    /**
     * @description Optional default RabbitMQ manager when not passed per consume() call
     * @param {RabbitMQManager} defaultRabbitMq - Falls back to package singleton `rabbitMQ` when omitted
     */
    constructor(defaultRabbitMq?: RabbitMQManager | undefined);
    /**
     * @description Start consumer for a queue (and optional exchange / routing key)
     * Uses `options.rabbitMq`, then service default, then singleton `rabbitMQ`.
     * @param {IRabbitMQConsumerOptions} options - Queue name, handler, prefetch, and optional `rabbitMq` instance
     */
    consume(options: IRabbitMQConsumerOptions): Promise<void>;
    /**
     * @description Initiate RabbitMQ consumer for each queue
     * Add app-specific consumer registrations inside this method if needed
     */
    initiateConsumer(): Promise<void>;
    /**
     * @description Disconnect all registered consumers
     * Cancels consumer tags; does not close the default `rabbitMQ` singleton connection.
     * Call `rabbitMQ.disconnect()` at application shutdown to close the shared connection.
     */
    disconnectConsumers(): Promise<void>;
    /**
     * @description Get the number of active consumers managed by this service
     * @returns {number} Consumer count
     */
    getConsumerCount(): number;
    /**
     * @description Get all consumer tags from active consumers
     * @returns {string[]} List of RabbitMQ consumer tags
     */
    getConsumerTags(): string[];
}
/** Pre-configured consumer service singleton */
export declare const consumer: ConsumerService;
