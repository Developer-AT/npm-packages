import { IRabbitMQConsumer, IRabbitMQConsumerOptions } from '../interface';
import { RabbitMQManager } from '../rabbitmq';
/**
 * @description RabbitMQ consumer class for consuming messages from queues
 * Uses a composed RabbitMQManager instance (default: package singleton `rabbitMQ`)
 * Provides message consumption with automatic acknowledgment
 */
export declare class RabbitMQConsumer implements IRabbitMQConsumer {
    private readonly rabbitMq;
    private readonly queue;
    private readonly exchange?;
    private readonly routingKey?;
    private readonly onMessage;
    private readonly prefetchCount;
    private consumerTag?;
    /**
     * @description Initialize RabbitMQ consumer with configuration
     * @param {IRabbitMQConsumerOptions} options - Consumer configuration options (queue, onMessage, optional `rabbitMq`)
     */
    constructor(options: IRabbitMQConsumerOptions);
    /**
     * @description Consume messages from the configured queue
     * Invokes `onMessage` for each message; ack on success, nack without requeue on failure
     */
    consumeEachMessage(): Promise<void>;
    /**
     * @description Open connection (via manager) and start consuming
     */
    connect(): Promise<void>;
    /**
     * @description Cancel consumer and optionally disconnect dedicated manager
     * Does not close the default `rabbitMQ` singleton connection
     */
    disconnect(): Promise<void>;
    /**
     * @description Register connection and channel event handlers
     */
    registerEvents(): Promise<void>;
    /**
     * @description Get consumer tag assigned by RabbitMQ
     * @returns {string | undefined} Consumer tag when consuming is active
     */
    getConsumerTag(): string | undefined;
    /**
     * @description Get the RabbitMQ manager instance used by this consumer
     * @returns {RabbitMQManager} Composed manager
     */
    getRabbitMq(): RabbitMQManager;
}
