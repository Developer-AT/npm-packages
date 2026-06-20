import { IRabbitMQProducer, IRabbitMQProducerOptions } from '../interface';
import { RabbitMQManager } from '../rabbitmq';
/**
 * @description RabbitMQ producer class for publishing messages to queues or exchanges
 * Uses a composed RabbitMQManager instance (default: package singleton `rabbitMQ`)
 */
export declare class RabbitMQProducer implements IRabbitMQProducer {
    private readonly rabbitMq;
    private readonly queue;
    private readonly exchange?;
    private readonly routingKey?;
    private readonly persistent;
    /**
     * @description Initialize RabbitMQ producer with configuration
     * @param {IRabbitMQProducerOptions} options - Producer configuration options (queue, exchange, routing key, optional `rabbitMq`)
     */
    constructor(options: IRabbitMQProducerOptions);
    /**
     * @description Publish message to RabbitMQ queue or exchange
     * @param {any} message - Payload serialized as JSON
     */
    produce(message: any): Promise<void>;
    /**
     * @description Setup queue and exchange if needed (call after connect when using exchanges)
     */
    setup(): Promise<void>;
    /**
     * @description Ensure the underlying RabbitMQ manager is connected
     */
    connect(): Promise<void>;
    /**
     * @description Close connection only for a dedicated manager instance
     * No-op when using the default `rabbitMQ` singleton (shared connection)
     */
    disconnect(): Promise<void>;
    /**
     * @description Get the RabbitMQ manager instance used by this producer
     * @returns {RabbitMQManager} Composed manager
     */
    getRabbitMq(): RabbitMQManager;
}
