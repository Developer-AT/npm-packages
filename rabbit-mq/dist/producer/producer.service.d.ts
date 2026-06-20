import { RabbitMQManager } from '../rabbitmq';
/**
 * @description Producer service for managing multiple RabbitMQ producers
 * Maintains a pool of producers for different queue/exchange combinations
 */
export declare class ProducerService {
    private readonly defaultRabbitMq?;
    private readonly producers;
    /**
     * @description Optional default RabbitMQ manager when not passed per produce() call
     * @param {RabbitMQManager} defaultRabbitMq - Falls back to package singleton `rabbitMQ` when omitted
     */
    constructor(defaultRabbitMq?: RabbitMQManager | undefined);
    /**
     * @description Publish message to queue/exchange
     * Resolves manager: per-call `rabbitMq` → service default → singleton `rabbitMQ`
     * @param {string} queue - Target queue name
     * @param {any} message - Message payload
     * @param {string} exchange - Optional exchange name
     * @param {string} routingKey - Optional routing key when using an exchange
     * @param {RabbitMQManager} rabbitMq - Optional manager override for this publish
     */
    produce(queue: string, message: any, exchange?: string, routingKey?: string, rabbitMq?: RabbitMQManager): Promise<void>;
    /**
     * @description Resolve RabbitMQ manager for producer pool and publish calls
     * @param {RabbitMQManager} rabbitMq - Optional override
     * @returns {RabbitMQManager} Resolved manager instance
     */
    private resolveManager;
    /**
     * @description Maintain a producer for each manager + queue/exchange combination
     * @param {string} queue - Queue name
     * @param {string} exchange - Optional exchange name
     * @param {string} routingKey - Optional routing key
     * @param {RabbitMQManager} rabbitMq - Optional manager override
     * @returns {Promise<IRabbitMQProducer>} Cached or newly created producer
     */
    private getProducer;
    /**
     * @description Disconnect all pooled producers
     * Does not close the default `rabbitMQ` singleton connection.
     * Call `rabbitMQ.disconnect()` at application shutdown to close the shared connection.
     */
    disconnectAll(): Promise<void>;
    /**
     * @description Get the number of producers in the pool
     * @returns {number} Producer count
     */
    getProducerCount(): number;
    /**
     * @description Get all producer pool keys
     * @returns {string[]} List of cache keys (manager + queue + exchange + routing key)
     */
    getProducerKeys(): string[];
}
/** Pre-configured producer service singleton */
export declare const producer: ProducerService;
