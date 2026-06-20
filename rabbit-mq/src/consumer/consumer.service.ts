import { IRabbitMQConsumer, IRabbitMQConsumerOptions } from '../interface';
import { rabbitMQ, RabbitMQManager } from '../rabbitmq';
import { RabbitMQConsumer } from './consumer.rabbitmq';

/**
 * @description Consumer service for managing multiple RabbitMQ consumers
 * Provides centralized management for multiple queue consumers
 */
export class ConsumerService {
    private readonly consumers: IRabbitMQConsumer[] = [];

    /**
     * @description Optional default RabbitMQ manager when not passed per consume() call
     * @param {RabbitMQManager} defaultRabbitMq - Falls back to package singleton `rabbitMQ` when omitted
     */
    constructor(private readonly defaultRabbitMq?: RabbitMQManager) {}

    /**
     * @description Start consumer for a queue (and optional exchange / routing key)
     * Uses `options.rabbitMq`, then service default, then singleton `rabbitMQ`.
     * @param {IRabbitMQConsumerOptions} options - Queue name, handler, prefetch, and optional `rabbitMq` instance
     */
    async consume(options: IRabbitMQConsumerOptions) {
        try {
            const manager = options.rabbitMq ?? this.defaultRabbitMq ?? rabbitMQ;
            const consumer = new RabbitMQConsumer({
                ...options,
                rabbitMq: manager
            });

            await consumer.connect();
            await consumer.registerEvents();
            this.consumers.push(consumer);

            console.info(`RabbitMQ Consumer started for queue: ${options.queue}`);
        } catch (error: any) {
            console.error(`Error-- RabbitMQ Consumer --msg :: `, error);
        }
    }

    /**
     * @description Initiate RabbitMQ consumer for each queue
     * Add app-specific consumer registrations inside this method if needed
     */
    async initiateConsumer() {
        try {
            // Example consumer setup - you can add your specific consumers here
        } catch (error: any) {
            console.error(`Error--RabbitMQ Consumer--msg :: `, error);
        }
    }

    /**
     * @description Disconnect all registered consumers
     * Cancels consumer tags; does not close the default `rabbitMQ` singleton connection.
     * Call `rabbitMQ.disconnect()` at application shutdown to close the shared connection.
     */
    async disconnectConsumers() {
        for (const consumer of this.consumers) {
            try {
                await consumer.disconnect();
                console.info('RabbitMQ Consumer disconnected');
            } catch (error: any) {
                console.error(`Error disconnecting RabbitMQ Consumer: `, error);
            }
        }
        this.consumers.length = 0;
    }

    /**
     * @description Get the number of active consumers managed by this service
     * @returns {number} Consumer count
     */
    getConsumerCount(): number {
        return this.consumers.length;
    }

    /**
     * @description Get all consumer tags from active consumers
     * @returns {string[]} List of RabbitMQ consumer tags
     */
    getConsumerTags(): string[] {
        return this.consumers
            .map((c) => (c as RabbitMQConsumer).getConsumerTag())
            .filter((tag): tag is string => tag !== undefined);
    }
}

/** Pre-configured consumer service singleton */
export const consumer = new ConsumerService();
