import { connect, ChannelModel, Channel } from 'amqplib';
import { IRabbitMQConfig, IQueueConfig, IExchangeConfig } from './interface';
import { fetchErrorMessage } from './manager-key';

/**
 * @description Base RabbitMQ manager class for connection and queue/exchange management
 * Provides core functionality for connecting to RabbitMQ and managing queues and exchanges
 */
export class RabbitMQManager {
    private config: IRabbitMQConfig | null = null;

    protected connection: ChannelModel | null = null;
    protected channel: Channel | null = null;

    /**
     * @description Set RabbitMQ connection configuration for this instance
     * @param {IRabbitMQConfig} config - RabbitMQ connection configuration
     */
    setConfig(config: IRabbitMQConfig): void {
        this.config = config;
    }

    /**
     * @description Whether this instance has been configured via setConfig
     */
    isConfigured(): boolean {
        return this.config !== null;
    }

    /**
     * @description Connection URL when configured (for pool keys / debugging)
     */
    getUrl(): string | undefined {
        return this.config?.url;
    }

    private getConfig(): IRabbitMQConfig {
        if (!this.config) {
            throw new Error(
                'RabbitMQ is not configured. Call setConfig({ url, connectionOptions }) on this RabbitMQManager instance first.'
            );
        }
        return this.config;
    }

    /**
     * @description Create the queue if it has not been already created.
     */
    async createQueue(queueConfig: IQueueConfig) {
        try {
            if (!this.channel) {
                throw new Error('Channel not initialized');
            }

            await this.channel.assertQueue(queueConfig.name, {
                durable: queueConfig.durable ?? true,
                exclusive: queueConfig.exclusive ?? false,
                autoDelete: queueConfig.autoDelete ?? false,
                arguments: queueConfig.arguments
            });

            console.info('RabbitMQ Queue Created ::', queueConfig.name);
        } catch (error) {
            console.error(`RabbitMQ Error Queue Creation ${fetchErrorMessage(error)}`);
        }
    }

    /**
     * @description Create the exchange if it has not been already created.
     */
    async createExchange(exchangeConfig: IExchangeConfig) {
        try {
            if (!this.channel) {
                throw new Error('Channel not initialized');
            }

            await this.channel.assertExchange(exchangeConfig.name, exchangeConfig.type, {
                durable: exchangeConfig.durable ?? true,
                autoDelete: exchangeConfig.autoDelete ?? false,
                arguments: exchangeConfig.arguments
            });

            console.info('RabbitMQ Exchange Created ::', exchangeConfig.name);
        } catch (error) {
            console.error(`RabbitMQ Error Exchange Creation ${fetchErrorMessage(error)}`);
        }
    }

    /**
     * @description Bind queue to exchange
     */
    async bindQueue(queueName: string, exchangeName: string, routingKey: string = '') {
        try {
            if (!this.channel) {
                throw new Error('Channel not initialized');
            }

            await this.channel.bindQueue(queueName, exchangeName, routingKey);
            console.info(`RabbitMQ Queue ${queueName} bound to exchange ${exchangeName} with routing key ${routingKey}`);
        } catch (error) {
            console.error(`RabbitMQ Error Binding Queue ${fetchErrorMessage(error)}`);
        }
    }

    /**
     * @description Get connection instance (null if not connected)
     */
    getConnection(): ChannelModel | null {
        return this.connection;
    }

    /**
     * @description Get channel instance
     */
    getChannel(): Channel {
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }
        return this.channel;
    }

    /**
     * @description Open Connection
     */
    async connect() {
        try {
            const config = this.getConfig();
            this.connection = <ChannelModel>await connect(config.url, config.connectionOptions);
            this.channel = await this.connection.createChannel();

            this.connection.on('error', (error) => {
                console.error('RabbitMQ Connection Error:', error);
            });

            this.connection.on('close', () => {
                console.warn('RabbitMQ Connection Closed');
            });

            console.info('Connected to RabbitMQ successfully');
        } catch (error) {
            console.error(`Failed to connect to RabbitMQ. ${fetchErrorMessage(error)}`);
            throw error;
        }
    }

    /**
     * @description Close Connection
     */
    async disconnect() {
        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }
            console.info('Disconnected from RabbitMQ');
        } catch (error) {
            console.error(`Error disconnecting from RabbitMQ: ${fetchErrorMessage(error)}`);
            throw error;
        }
    }

    /**
     * @description Check if connection is alive
     */
    isConnected(): boolean {
        return this.connection !== null;
    }

    /**
     * @description Reconnect if connection is lost
     */
    async reconnect() {
        if (!this.isConnected()) {
            await this.connect();
        }
    }
}

/** Default shared RabbitMQ manager for producer/consumer services */
export const rabbitMQ = new RabbitMQManager();
