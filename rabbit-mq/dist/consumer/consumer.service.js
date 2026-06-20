"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumer = exports.ConsumerService = void 0;
const rabbitmq_1 = require("../rabbitmq");
const consumer_rabbitmq_1 = require("./consumer.rabbitmq");
/**
 * @description Consumer service for managing multiple RabbitMQ consumers
 * Provides centralized management for multiple queue consumers
 */
class ConsumerService {
    defaultRabbitMq;
    consumers = [];
    /**
     * @description Optional default RabbitMQ manager when not passed per consume() call
     * @param {RabbitMQManager} defaultRabbitMq - Falls back to package singleton `rabbitMQ` when omitted
     */
    constructor(defaultRabbitMq) {
        this.defaultRabbitMq = defaultRabbitMq;
    }
    /**
     * @description Start consumer for a queue (and optional exchange / routing key)
     * Uses `options.rabbitMq`, then service default, then singleton `rabbitMQ`.
     * @param {IRabbitMQConsumerOptions} options - Queue name, handler, prefetch, and optional `rabbitMq` instance
     */
    async consume(options) {
        try {
            const manager = options.rabbitMq ?? this.defaultRabbitMq ?? rabbitmq_1.rabbitMQ;
            const consumer = new consumer_rabbitmq_1.RabbitMQConsumer({
                ...options,
                rabbitMq: manager
            });
            await consumer.connect();
            await consumer.registerEvents();
            this.consumers.push(consumer);
            console.info(`RabbitMQ Consumer started for queue: ${options.queue}`);
        }
        catch (error) {
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
        }
        catch (error) {
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
            }
            catch (error) {
                console.error(`Error disconnecting RabbitMQ Consumer: `, error);
            }
        }
        this.consumers.length = 0;
    }
    /**
     * @description Get the number of active consumers managed by this service
     * @returns {number} Consumer count
     */
    getConsumerCount() {
        return this.consumers.length;
    }
    /**
     * @description Get all consumer tags from active consumers
     * @returns {string[]} List of RabbitMQ consumer tags
     */
    getConsumerTags() {
        return this.consumers
            .map((c) => c.getConsumerTag())
            .filter((tag) => tag !== undefined);
    }
}
exports.ConsumerService = ConsumerService;
/** Pre-configured consumer service singleton */
exports.consumer = new ConsumerService();
//# sourceMappingURL=consumer.service.js.map