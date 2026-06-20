import type { RabbitMQManager } from './rabbitmq';

interface IRabbitMQConnection {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
}

export interface IRabbitMQProducer extends IRabbitMQConnection {
    produce: (message: any) => Promise<void>;
}

export interface IRabbitMQConsumer extends IRabbitMQConnection {
    consumeEachMessage: () => Promise<void>;
    registerEvents: () => Promise<void>;
}

export interface IRabbitMQConsumerOptions {
    queue: string;
    exchange?: string;
    routingKey?: string;
    onMessage: (message: any) => Promise<void>;
    prefetchCount?: number;
    durable?: boolean;
    exclusive?: boolean;
    autoDelete?: boolean;
    /** Optional manager instance; defaults to package singleton `rabbitMQ` */
    rabbitMq?: RabbitMQManager;
}

export interface IRabbitMQProducerOptions {
    queue: string;
    exchange?: string;
    routingKey?: string;
    durable?: boolean;
    exclusive?: boolean;
    autoDelete?: boolean;
    persistent?: boolean;
    /** Optional manager instance; defaults to package singleton `rabbitMQ` */
    rabbitMq?: RabbitMQManager;
}

export interface IRabbitMQConfig {
    url: string;
    connectionOptions?: any;
}

export interface IQueueConfig {
    name: string;
    durable?: boolean;
    exclusive?: boolean;
    autoDelete?: boolean;
    arguments?: any;
}

export interface IExchangeConfig {
    name: string;
    type: 'direct' | 'topic' | 'fanout' | 'headers';
    durable?: boolean;
    autoDelete?: boolean;
    arguments?: any;
}

// Generic message payload
export interface IMessagePayload {
    [key: string]: unknown;
}

// RabbitMQ message - allows both generic and specific message types
export type IRabbitMQMessage = IMessagePayload & { [key: string]: unknown };
