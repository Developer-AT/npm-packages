"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQProducer = void 0;
const manager_key_1 = require("../manager-key");
const rabbitmq_1 = require("../rabbitmq");
/**
 * @description RabbitMQ producer class for publishing messages to queues or exchanges
 * Uses a composed RabbitMQManager instance (default: package singleton `rabbitMQ`)
 */
class RabbitMQProducer {
    rabbitMq;
    queue;
    exchange;
    routingKey;
    persistent;
    /**
     * @description Initialize RabbitMQ producer with configuration
     * @param {IRabbitMQProducerOptions} options - Producer configuration options (queue, exchange, routing key, optional `rabbitMq`)
     */
    constructor(options) {
        this.rabbitMq = options.rabbitMq ?? rabbitmq_1.rabbitMQ;
        this.queue = options.queue;
        this.exchange = options.exchange;
        this.routingKey = options.routingKey || '';
        this.persistent = options.persistent ?? true;
    }
    /**
     * @description Publish message to RabbitMQ queue or exchange
     * @param {any} message - Payload serialized as JSON
     */
    async produce(message) {
        try {
            if (!this.rabbitMq.isConnected()) {
                await this.rabbitMq.reconnect();
            }
            const channel = this.rabbitMq.getChannel();
            const messageBuffer = Buffer.from(JSON.stringify(message));
            if (this.exchange) {
                // Publish to exchange with routing key
                channel.publish(this.exchange, this.routingKey || '', messageBuffer, {
                    persistent: this.persistent,
                    timestamp: Date.now()
                });
                console.info(`Message published to exchange: ${this.exchange}, routing key: ${this.routingKey}`);
            }
            else {
                // Publish directly to queue
                channel.sendToQueue(this.queue, messageBuffer, {
                    persistent: this.persistent,
                    timestamp: Date.now()
                });
                console.info(`Message published to queue: ${this.queue}`);
            }
        }
        catch (error) {
            console.error(`Error publishing message to RabbitMQ: ${(0, manager_key_1.fetchErrorMessage)(error)}`);
            throw error;
        }
    }
    /**
     * @description Setup queue and exchange if needed (call after connect when using exchanges)
     */
    async setup() {
        try {
            if (this.exchange) {
                // Create exchange
                await this.rabbitMq.createExchange({
                    name: this.exchange,
                    type: 'direct',
                    durable: true
                });
                // Create queue
                await this.rabbitMq.createQueue({
                    name: this.queue,
                    durable: true
                });
                // Bind queue to exchange
                await this.rabbitMq.bindQueue(this.queue, this.exchange, this.routingKey);
            }
            else {
                // Create queue only
                await this.rabbitMq.createQueue({
                    name: this.queue,
                    durable: true
                });
            }
        }
        catch (error) {
            console.error(`Error setting up RabbitMQ producer: ${(0, manager_key_1.fetchErrorMessage)(error)}`);
            throw error;
        }
    }
    /**
     * @description Ensure the underlying RabbitMQ manager is connected
     */
    async connect() {
        try {
            if (!this.rabbitMq.isConnected()) {
                await this.rabbitMq.connect();
            }
            // await this.setup();
        }
        catch (error) {
            console.error(`Failed to connect RabbitMQ Producer. ${(0, manager_key_1.fetchErrorMessage)(error)}`);
            throw error;
        }
    }
    /**
     * @description Close connection only for a dedicated manager instance
     * No-op when using the default `rabbitMQ` singleton (shared connection)
     */
    async disconnect() {
        if (this.rabbitMq === rabbitmq_1.rabbitMQ) {
            return;
        }
        await this.rabbitMq.disconnect();
    }
    /**
     * @description Get the RabbitMQ manager instance used by this producer
     * @returns {RabbitMQManager} Composed manager
     */
    getRabbitMq() {
        return this.rabbitMq;
    }
}
exports.RabbitMQProducer = RabbitMQProducer;
//# sourceMappingURL=producer.rabbitmq.js.map