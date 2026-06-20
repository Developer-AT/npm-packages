"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.producer = exports.ProducerService = void 0;
const manager_key_1 = require("../manager-key");
const rabbitmq_1 = require("../rabbitmq");
const producer_rabbitmq_1 = require("./producer.rabbitmq");
/**
 * @description Producer service for managing multiple RabbitMQ producers
 * Maintains a pool of producers for different queue/exchange combinations
 */
class ProducerService {
    defaultRabbitMq;
    producers = new Map();
    /**
     * @description Optional default RabbitMQ manager when not passed per produce() call
     * @param {RabbitMQManager} defaultRabbitMq - Falls back to package singleton `rabbitMQ` when omitted
     */
    constructor(defaultRabbitMq) {
        this.defaultRabbitMq = defaultRabbitMq;
    }
    /**
     * @description Publish message to queue/exchange
     * Resolves manager: per-call `rabbitMq` → service default → singleton `rabbitMQ`
     * @param {string} queue - Target queue name
     * @param {any} message - Message payload
     * @param {string} exchange - Optional exchange name
     * @param {string} routingKey - Optional routing key when using an exchange
     * @param {RabbitMQManager} rabbitMq - Optional manager override for this publish
     */
    async produce(queue, message, exchange, routingKey, rabbitMq) {
        try {
            const manager = rabbitMq ?? this.defaultRabbitMq ?? rabbitmq_1.rabbitMQ;
            const producer = await this.getProducer(queue, exchange, routingKey, manager);
            await producer.produce(message);
            console.info(`RabbitMQ Producer Message Published :: ${queue}`);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * @description Resolve RabbitMQ manager for producer pool and publish calls
     * @param {RabbitMQManager} rabbitMq - Optional override
     * @returns {RabbitMQManager} Resolved manager instance
     */
    resolveManager(rabbitMq) {
        return rabbitMq ?? this.defaultRabbitMq ?? rabbitmq_1.rabbitMQ;
    }
    /**
     * @description Maintain a producer for each manager + queue/exchange combination
     * @param {string} queue - Queue name
     * @param {string} exchange - Optional exchange name
     * @param {string} routingKey - Optional routing key
     * @param {RabbitMQManager} rabbitMq - Optional manager override
     * @returns {Promise<IRabbitMQProducer>} Cached or newly created producer
     */
    async getProducer(queue, exchange, routingKey, rabbitMq) {
        const manager = this.resolveManager(rabbitMq);
        const producerKey = `${(0, manager_key_1.getManagerPoolKey)(manager)}_${queue}_${exchange || 'direct'}_${routingKey || ''}`;
        let producer = this.producers.get(producerKey);
        if (!producer) {
            producer = new producer_rabbitmq_1.RabbitMQProducer({
                queue,
                exchange,
                routingKey,
                durable: true,
                persistent: true,
                rabbitMq: manager
            });
            await producer.connect();
            this.producers.set(producerKey, producer);
        }
        return producer;
    }
    /**
     * @description Disconnect all pooled producers
     * Does not close the default `rabbitMQ` singleton connection.
     * Call `rabbitMQ.disconnect()` at application shutdown to close the shared connection.
     */
    async disconnectAll() {
        for (const [key, producer] of this.producers) {
            try {
                await producer.disconnect();
                console.info(`Disconnected producer: ${key}`);
            }
            catch (error) {
                console.error(`Error disconnecting producer ${key}:`, error);
            }
        }
        this.producers.clear();
    }
    /**
     * @description Get the number of producers in the pool
     * @returns {number} Producer count
     */
    getProducerCount() {
        return this.producers.size;
    }
    /**
     * @description Get all producer pool keys
     * @returns {string[]} List of cache keys (manager + queue + exchange + routing key)
     */
    getProducerKeys() {
        return Array.from(this.producers.keys());
    }
}
exports.ProducerService = ProducerService;
/** Pre-configured producer service singleton */
exports.producer = new ProducerService();
//# sourceMappingURL=producer.service.js.map