"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQConsumer = void 0;
const manager_key_1 = require("../manager-key");
const rabbitmq_1 = require("../rabbitmq");
/**
 * @description RabbitMQ consumer class for consuming messages from queues
 * Uses a composed RabbitMQManager instance (default: package singleton `rabbitMQ`)
 * Provides message consumption with automatic acknowledgment
 */
class RabbitMQConsumer {
    rabbitMq;
    queue;
    exchange;
    routingKey;
    onMessage;
    prefetchCount;
    consumerTag;
    /**
     * @description Initialize RabbitMQ consumer with configuration
     * @param {IRabbitMQConsumerOptions} options - Consumer configuration options (queue, onMessage, optional `rabbitMq`)
     */
    constructor(options) {
        this.rabbitMq = options.rabbitMq ?? rabbitmq_1.rabbitMQ;
        this.queue = options.queue;
        this.exchange = options.exchange;
        this.routingKey = options.routingKey || '';
        this.onMessage = options.onMessage;
        this.prefetchCount = options.prefetchCount || 1;
    }
    /**
     * @description Consume messages from the configured queue
     * Invokes `onMessage` for each message; ack on success, nack without requeue on failure
     */
    async consumeEachMessage() {
        try {
            if (!this.rabbitMq.isConnected()) {
                await this.rabbitMq.reconnect();
            }
            const channel = this.rabbitMq.getChannel();
            // Set prefetch count for fair dispatch
            await channel.prefetch(this.prefetchCount);
            // Setup queue and exchange if needed
            // await this.setup();
            // Start consuming
            const result = await channel.consume(this.queue, async (msg) => {
                if (msg) {
                    try {
                        console.info(`RabbitMQ Processing message from queue: ${this.queue}`);
                        const messageContent = msg.content.toString();
                        console.info(`RabbitMQ Consumer Data :: ${messageContent}`);
                        const parsedMessage = JSON.parse(messageContent);
                        await this.onMessage(parsedMessage);
                        // Acknowledge the message
                        channel.ack(msg);
                        console.info('RabbitMQ Message processed and acknowledged');
                    }
                    catch (error) {
                        console.error(`Error-- RabbitMQ Consumer message processing --msg :: `, error);
                        // Reject the message and don't requeue it
                        channel.nack(msg, false, false);
                    }
                }
            }, {
                noAck: false
            });
            this.consumerTag = result.consumerTag;
            console.info(`RabbitMQ Consumer started with tag: ${this.consumerTag}`);
        }
        catch (error) {
            console.error(`Error-- RabbitMQ Consumer setup --msg :: ${(0, manager_key_1.fetchErrorMessage)(error)}`);
            throw error;
        }
    }
    /**
     * @description Open connection (via manager) and start consuming
     */
    async connect() {
        try {
            if (!this.rabbitMq.isConnected()) {
                await this.rabbitMq.connect();
            }
            await this.consumeEachMessage();
        }
        catch (error) {
            console.error(`Error-- Failed to connect to RabbitMQ --msg :: ${(0, manager_key_1.fetchErrorMessage)(error)}`);
            throw error;
        }
    }
    /**
     * @description Cancel consumer and optionally disconnect dedicated manager
     * Does not close the default `rabbitMQ` singleton connection
     */
    async disconnect() {
        try {
            if (this.consumerTag && this.rabbitMq.isConnected()) {
                try {
                    const channel = this.rabbitMq.getChannel();
                    await channel.cancel(this.consumerTag);
                    console.info(`RabbitMQ Consumer cancelled: ${this.consumerTag}`);
                }
                catch (error) {
                    console.error(`Error cancelling RabbitMQ consumer: ${(0, manager_key_1.fetchErrorMessage)(error)}`);
                }
            }
            this.consumerTag = undefined;
            if (this.rabbitMq !== rabbitmq_1.rabbitMQ) {
                await this.rabbitMq.disconnect();
            }
        }
        catch (error) {
            console.error(`Error disconnecting RabbitMQ Consumer: ${(0, manager_key_1.fetchErrorMessage)(error)}`);
        }
    }
    /**
     * @description Register connection and channel event handlers
     */
    async registerEvents() {
        const connection = this.rabbitMq.getConnection();
        if (connection) {
            connection.on('error', (error) => {
                console.error(`Error-- RabbitMQ Consumer Connection Error --msg :: `, error);
            });
            connection.on('close', () => {
                console.warn('RabbitMQ Consumer Connection Closed');
            });
        }
        if (this.rabbitMq.isConnected()) {
            const channel = this.rabbitMq.getChannel();
            channel.on('error', (error) => {
                console.error(`Error-- RabbitMQ Consumer Channel Error --msg :: `, error);
            });
            channel.on('close', () => {
                console.warn('RabbitMQ Consumer Channel Closed');
            });
        }
    }
    /**
     * @description Get consumer tag assigned by RabbitMQ
     * @returns {string | undefined} Consumer tag when consuming is active
     */
    getConsumerTag() {
        return this.consumerTag;
    }
    /**
     * @description Get the RabbitMQ manager instance used by this consumer
     * @returns {RabbitMQManager} Composed manager
     */
    getRabbitMq() {
        return this.rabbitMq;
    }
}
exports.RabbitMQConsumer = RabbitMQConsumer;
//# sourceMappingURL=consumer.rabbitmq.js.map