import { fetchErrorMessage } from '../manager-key';
import { IRabbitMQProducer, IRabbitMQProducerOptions } from '../interface';
import { rabbitMQ, RabbitMQManager } from '../rabbitmq';

/**
 * @description RabbitMQ producer class for publishing messages to queues or exchanges
 * Uses a composed RabbitMQManager instance (default: package singleton `rabbitMQ`)
 */
export class RabbitMQProducer implements IRabbitMQProducer {
    private readonly rabbitMq: RabbitMQManager;
    private readonly queue: string;
    private readonly exchange?: string;
    private readonly routingKey?: string;
    private readonly persistent: boolean;

    /**
     * @description Initialize RabbitMQ producer with configuration
     * @param {IRabbitMQProducerOptions} options - Producer configuration options (queue, exchange, routing key, optional `rabbitMq`)
     */
    constructor(options: IRabbitMQProducerOptions) {
        this.rabbitMq = options.rabbitMq ?? rabbitMQ;
        this.queue = options.queue;
        this.exchange = options.exchange;
        this.routingKey = options.routingKey || '';
        this.persistent = options.persistent ?? true;
    }

    /**
     * @description Publish message to RabbitMQ queue or exchange
     * @param {any} message - Payload serialized as JSON
     */
    async produce(message: any) {
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
            } else {
                // Publish directly to queue
                channel.sendToQueue(this.queue, messageBuffer, {
                    persistent: this.persistent,
                    timestamp: Date.now()
                });
                console.info(`Message published to queue: ${this.queue}`);
            }
        } catch (error: any) {
            console.error(`Error publishing message to RabbitMQ: ${fetchErrorMessage(error)}`);
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
            } else {
                // Create queue only
                await this.rabbitMq.createQueue({
                    name: this.queue,
                    durable: true
                });
            }
        } catch (error: any) {
            console.error(`Error setting up RabbitMQ producer: ${fetchErrorMessage(error)}`);
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
        } catch (error: any) {
            console.error(`Failed to connect RabbitMQ Producer. ${fetchErrorMessage(error)}`);
            throw error;
        }
    }

    /**
     * @description Close connection only for a dedicated manager instance
     * No-op when using the default `rabbitMQ` singleton (shared connection)
     */
    async disconnect() {
        if (this.rabbitMq === rabbitMQ) {
            return;
        }
        await this.rabbitMq.disconnect();
    }

    /**
     * @description Get the RabbitMQ manager instance used by this producer
     * @returns {RabbitMQManager} Composed manager
     */
    getRabbitMq(): RabbitMQManager {
        return this.rabbitMq;
    }
}
