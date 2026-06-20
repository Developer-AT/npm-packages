import { ChannelModel, Channel } from 'amqplib';
import { IRabbitMQConfig, IQueueConfig, IExchangeConfig } from './interface';
/**
 * @description Base RabbitMQ manager class for connection and queue/exchange management
 * Provides core functionality for connecting to RabbitMQ and managing queues and exchanges
 */
export declare class RabbitMQManager {
    private config;
    protected connection: ChannelModel | null;
    protected channel: Channel | null;
    /**
     * @description Set RabbitMQ connection configuration for this instance
     * @param {IRabbitMQConfig} config - RabbitMQ connection configuration
     */
    setConfig(config: IRabbitMQConfig): void;
    /**
     * @description Whether this instance has been configured via setConfig
     */
    isConfigured(): boolean;
    /**
     * @description Connection URL when configured (for pool keys / debugging)
     */
    getUrl(): string | undefined;
    private getConfig;
    /**
     * @description Create the queue if it has not been already created.
     */
    createQueue(queueConfig: IQueueConfig): Promise<void>;
    /**
     * @description Create the exchange if it has not been already created.
     */
    createExchange(exchangeConfig: IExchangeConfig): Promise<void>;
    /**
     * @description Bind queue to exchange
     */
    bindQueue(queueName: string, exchangeName: string, routingKey?: string): Promise<void>;
    /**
     * @description Get connection instance (null if not connected)
     */
    getConnection(): ChannelModel | null;
    /**
     * @description Get channel instance
     */
    getChannel(): Channel;
    /**
     * @description Open Connection
     */
    connect(): Promise<void>;
    /**
     * @description Close Connection
     */
    disconnect(): Promise<void>;
    /**
     * @description Check if connection is alive
     */
    isConnected(): boolean;
    /**
     * @description Reconnect if connection is lost
     */
    reconnect(): Promise<void>;
}
/** Default shared RabbitMQ manager for producer/consumer services */
export declare const rabbitMQ: RabbitMQManager;
