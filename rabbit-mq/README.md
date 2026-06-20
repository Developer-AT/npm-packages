# @developer-at/rabbit-mq

A comprehensive RabbitMQ client package for Node.js applications. Provides easy-to-use producer and consumer services with connection management, queue/exchange handling, and automatic reconnection.

## Installation

```bash
npm install @developer-at/rabbit-mq
```

## Features

- Producer service for publishing messages
- Consumer service for consuming messages
- Default `rabbitMQ` singleton with optional custom `RabbitMQManager` instances
- Automatic connection management
- Queue and exchange creation
- Message acknowledgment handling
- Prefetch count configuration
- TypeScript support

## Prerequisites

- RabbitMQ server running and accessible
- Connection URL (e.g., `amqp://localhost:5672`)

## Usage

### Basic Setup

Configure RabbitMQ **once** at startup. All producers and consumers use this config automatically.

```typescript
import { rabbitMQ, producer, consumer } from '@developer-at/rabbit-mq';

rabbitMQ.setConfig({
  url: 'amqp://localhost:5672',
  connectionOptions: {
    // Optional connection options
  }
});

await producer.produce('my-queue', { event: 'created' });

await consumer.consume({
  queue: 'my-queue',
  onMessage: async (message) => {
    console.log('Received:', message);
  }
});
```

For queue/exchange setup with a dedicated manager instance:

```typescript
import { rabbitMQ } from '@developer-at/rabbit-mq';

await rabbitMQ.connect();
await rabbitMQ.createQueue({ name: 'user-events', durable: true });
```

### Alternate broker (optional)

Pass a custom `RabbitMQManager` when you need a different URL:

```typescript
import { rabbitMQ, producer } from '@developer-at/rabbit-mq';

const analyticsMq = new RabbitMQManager();
analyticsMq.setConfig({ url: process.env.ANALYTICS_RABBIT_URL! });

await producer.produce('events', { id: 1 }, undefined, undefined, analyticsMq);
```

Or pass `rabbitMq` on consumer options: `consumer.consume({ queue: 'events', onMessage, rabbitMq: analyticsMq })`.

### Shutdown

`producer.disconnectAll()` and `consumer.disconnectConsumers()` do **not** close the default `rabbitMQ` connection. On app shutdown:

```typescript
await producer.disconnectAll();
await consumer.disconnectConsumers();
await rabbitMQ.disconnect();
```

### Queue and Exchange Management

#### Creating Queues

Use the `createQueue` method from `RabbitMQManager` to create queues before using them:

```typescript
import { rabbitMQ } from '@developer-at/rabbit-mq';

rabbitMQ.setConfig({ url: 'amqp://localhost:5672' });
await rabbitMQ.connect();

// Create a durable queue (survives broker restart)
await rabbitMQ.createQueue({
  name: 'user-events',
  durable: true,        // Queue persists after broker restart
  exclusive: false,     // Queue can be accessed by multiple connections
  autoDelete: false     // Queue is not deleted when unused
});

// Create a temporary queue (deleted when connection closes)
await rabbitMQ.createQueue({
  name: 'temp-queue',
  durable: false,
  exclusive: true,      // Queue is exclusive to this connection
  autoDelete: true      // Queue is deleted when unused
});
```

#### Creating Exchanges

Use the `createExchange` method to create exchanges for message routing:

```typescript
import { rabbitMQ } from '@developer-at/rabbit-mq';

rabbitMQ.setConfig({ url: 'amqp://localhost:5672' });
await rabbitMQ.connect();

// Create a direct exchange (routes messages based on exact routing key match)
await rabbitMQ.createExchange({
  name: 'user-exchange',
  type: 'direct',       // Options: 'direct', 'topic', 'fanout', 'headers'
  durable: true,         // Exchange persists after broker restart
  autoDelete: false      // Exchange is not deleted when unused
});

// Create a topic exchange (routes messages based on pattern matching)
await rabbitMQ.createExchange({
  name: 'notifications',
  type: 'topic',
  durable: true
});

// Create a fanout exchange (broadcasts to all bound queues)
await rabbitMQ.createExchange({
  name: 'broadcast',
  type: 'fanout',
  durable: true
});
```

#### Binding Queues to Exchanges

Use `bindQueue` to connect queues to exchanges with routing keys. The routing key determines which messages from the exchange are delivered to the queue:

```typescript
import { rabbitMQ } from '@developer-at/rabbit-mq';

rabbitMQ.setConfig({ url: 'amqp://localhost:5672' });
await rabbitMQ.connect();

// Create exchange and queue first
await rabbitMQ.createExchange({
  name: 'user-exchange',
  type: 'direct',
  durable: true
});

await rabbitMQ.createQueue({
  name: 'user-created-queue',
  durable: true
});

// Bind queue to exchange with routing key
// Messages published to 'user-exchange' with routing key 'user.created' 
// will be routed to 'user-created-queue'
await rabbitMQ.bindQueue('user-created-queue', 'user-exchange', 'user.created');

// You can bind the same queue to multiple routing keys
await rabbitMQ.bindQueue('user-created-queue', 'user-exchange', 'user.updated');

// For fanout exchanges, routing key is ignored (all messages go to all bound queues)
await rabbitMQ.createExchange({ name: 'broadcast', type: 'fanout', durable: true });
await rabbitMQ.bindQueue('queue1', 'broadcast', ''); // routing key ignored for fanout
await rabbitMQ.bindQueue('queue2', 'broadcast', ''); // routing key ignored for fanout
```

**How Routing Works:**

- **Direct Exchange**: Routes messages where routing key exactly matches the binding key

  - Example: Binding key `'user.created'` receives messages with routing key `'user.created'` only
- **Topic Exchange**: Routes messages using pattern matching (wildcards: `*` for single word, `#` for multiple words)

  - Example: Binding key `'user.*'` receives `'user.created'`, `'user.updated'`, etc.
  - Example: Binding key `'user.#'` receives `'user.created'`, `'user.profile.updated'`, etc.
- **Fanout Exchange**: Routes all messages to all bound queues (routing key is ignored)
- **Headers Exchange**: Routes based on message headers (not routing key)

### Producer Usage

#### Simple Queue Producer (Without Exchange)

When you don't specify an exchange, messages are sent directly to the queue:

```typescript
import { rabbitMQ, producer } from '@developer-at/rabbit-mq';

// Setup connection
rabbitMQ.setConfig({ url: 'amqp://localhost:5672' });
await rabbitMQ.connect();

// Create queue first (optional, but recommended)
await rabbitMQ.createQueue({
  name: 'user-events',
  durable: true
});

// Publish message directly to queue (no exchange, no routing key)
await producer.produce('user-events', {
  userId: '123',
  action: 'user.created',
  data: { name: 'John Doe', email: 'john@example.com' }
});
```

#### Producer with Exchange and Routing Key

When using an exchange, you must specify both the exchange name and routing key. The routing key determines which bound queues receive the message:

```typescript
import { rabbitMQ, producer } from '@developer-at/rabbit-mq';

// Setup connection
rabbitMQ.setConfig({ url: 'amqp://localhost:5672' });
await rabbitMQ.connect();

// Create exchange
await rabbitMQ.createExchange({
  name: 'user-exchange',
  type: 'direct',
  durable: true
});

// Create queues
await rabbitMQ.createQueue({ name: 'user-created-queue', durable: true });
await rabbitMQ.createQueue({ name: 'user-updated-queue', durable: true });

// Bind queues to exchange with different routing keys
await rabbitMQ.bindQueue('user-created-queue', 'user-exchange', 'user.created');
await rabbitMQ.bindQueue('user-updated-queue', 'user-exchange', 'user.updated');

// Publish message to exchange with routing key 'user.created'
// This message will be routed to 'user-created-queue' only
await producer.produce(
  'user-created-queue',  // Queue name (used for binding reference)
  { userId: '123', action: 'created', name: 'John Doe' },
  'user-exchange',       // Exchange name
  'user.created'         // Routing key - determines which queue receives the message
);

// Publish message with routing key 'user.updated'
// This message will be routed to 'user-updated-queue' only
await producer.produce(
  'user-updated-queue',
  { userId: '123', action: 'updated', email: 'newemail@example.com' },
  'user-exchange',
  'user.updated'
);
```

#### Topic Exchange Example with Pattern Matching

```typescript
import { rabbitMQ, producer } from '@developer-at/rabbit-mq';

rabbitMQ.setConfig({ url: 'amqp://localhost:5672' });
await rabbitMQ.connect();

// Create topic exchange
await rabbitMQ.createExchange({
  name: 'notifications',
  type: 'topic',
  durable: true
});

// Create queues
await rabbitMQ.createQueue({ name: 'email-queue', durable: true });
await rabbitMQ.createQueue({ name: 'sms-queue', durable: true });
await rabbitMQ.createQueue({ name: 'all-notifications-queue', durable: true });

// Bind with pattern matching
await rabbitMQ.bindQueue('email-queue', 'notifications', 'notification.email.*');
await rabbitMQ.bindQueue('sms-queue', 'notifications', 'notification.sms.*');
await rabbitMQ.bindQueue('all-notifications-queue', 'notifications', 'notification.#');

// Publish to 'notification.email.user' - goes to email-queue and all-notifications-queue
await producer.produce(
  'email-queue',
  { type: 'email', to: 'user@example.com', subject: 'Welcome' },
  'notifications',
  'notification.email.user'
);

// Publish to 'notification.sms.user' - goes to sms-queue and all-notifications-queue
await producer.produce(
  'sms-queue',
  { type: 'sms', to: '+1234567890', message: 'Hello' },
  'notifications',
  'notification.sms.user'
);
```

#### Fanout Exchange Example (Broadcast)

```typescript
import { rabbitMQ, producer } from '@developer-at/rabbit-mq';

rabbitMQ.setConfig({ url: 'amqp://localhost:5672' });
await rabbitMQ.connect();

// Create fanout exchange
await rabbitMQ.createExchange({
  name: 'broadcast',
  type: 'fanout',
  durable: true
});

// Create multiple queues
await rabbitMQ.createQueue({ name: 'queue1', durable: true });
await rabbitMQ.createQueue({ name: 'queue2', durable: true });
await rabbitMQ.createQueue({ name: 'queue3', durable: true });

// Bind all queues to fanout exchange (routing key is ignored)
await rabbitMQ.bindQueue('queue1', 'broadcast', '');
await rabbitMQ.bindQueue('queue2', 'broadcast', '');
await rabbitMQ.bindQueue('queue3', 'broadcast', '');

// Publish message - ALL queues receive it (routing key is ignored for fanout)
await producer.produce(
  'queue1',  // Any queue name works, all bound queues receive the message
  { message: 'Broadcast to all queues' },
  'broadcast',
  ''  // Routing key is ignored for fanout exchanges
);
```

### Consumer Usage

#### Basic Consumer (Without Exchange)

When consuming from a queue without an exchange, messages are consumed directly from the queue:

```typescript
import { rabbitMQ, consumer } from '@developer-at/rabbit-mq';

// Setup connection
rabbitMQ.setConfig({ url: 'amqp://localhost:5672' });
await rabbitMQ.connect();

// Create queue first (optional, but recommended)
await rabbitMQ.createQueue({
  name: 'user-events',
  durable: true
});

// Start consuming messages directly from queue
// No exchange or routing key needed
await consumer.consume({
  queue: 'user-events',
  onMessage: async (message) => {
    console.log('Received message:', message);
  
    // Process the message
    await processMessage(message);
  
    // Message is automatically acknowledged on success
    // Automatically nacked on error (not requeued)
  }
});
```

#### Consumer with Exchange and Routing Key

When consuming from an exchange-based setup, you need to specify the exchange and routing key that the queue is bound to:

```typescript
import { rabbitMQ, consumer } from '@developer-at/rabbit-mq';

// Setup connection
rabbitMQ.setConfig({ url: 'amqp://localhost:5672' });
await rabbitMQ.connect();

// Create exchange
await rabbitMQ.createExchange({
  name: 'user-exchange',
  type: 'direct',
  durable: true
});

// Create queue
await rabbitMQ.createQueue({
  name: 'user-created-queue',
  durable: true
});

// Bind queue to exchange with routing key
await rabbitMQ.bindQueue('user-created-queue', 'user-exchange', 'user.created');

// Consume from queue that's bound to exchange
// You must specify the exchange and routing key that the queue is bound to
await consumer.consume({
  queue: 'user-created-queue',
  exchange: 'user-exchange',      // Exchange name the queue is bound to
  routingKey: 'user.created',      // Routing key used in the binding
  prefetchCount: 10,               // Process up to 10 messages at a time
  durable: true,
  onMessage: async (message) => {
    console.log('Received user created event:', message);
    await handleUserCreated(message);
  }
});
```

#### Multiple Consumers with Different Routing Keys

```typescript
import { rabbitMQ, consumer } from '@developer-at/rabbit-mq';

rabbitMQ.setConfig({ url: 'amqp://localhost:5672' });
await rabbitMQ.connect();

// Setup exchange
await rabbitMQ.createExchange({
  name: 'user-exchange',
  type: 'direct',
  durable: true
});

// Create queues for different events
await rabbitMQ.createQueue({ name: 'user-created-queue', durable: true });
await rabbitMQ.createQueue({ name: 'user-updated-queue', durable: true });
await rabbitMQ.createQueue({ name: 'user-deleted-queue', durable: true });

// Bind queues with different routing keys
await rabbitMQ.bindQueue('user-created-queue', 'user-exchange', 'user.created');
await rabbitMQ.bindQueue('user-updated-queue', 'user-exchange', 'user.updated');
await rabbitMQ.bindQueue('user-deleted-queue', 'user-exchange', 'user.deleted');

// Consumer for user.created events
await consumer.consume({
  queue: 'user-created-queue',
  exchange: 'user-exchange',
  routingKey: 'user.created',
  onMessage: async (message) => {
    console.log('User created:', message);
  }
});

// Consumer for user.updated events
await consumer.consume({
  queue: 'user-updated-queue',
  exchange: 'user-exchange',
  routingKey: 'user.updated',
  onMessage: async (message) => {
    console.log('User updated:', message);
  }
});

// Consumer for user.deleted events
await consumer.consume({
  queue: 'user-deleted-queue',
  exchange: 'user-exchange',
  routingKey: 'user.deleted',
  onMessage: async (message) => {
    console.log('User deleted:', message);
  }
});
```

#### Topic Exchange Consumer with Pattern Matching

```typescript
import { rabbitMQ, consumer } from '@developer-at/rabbit-mq';

rabbitMQ.setConfig({ url: 'amqp://localhost:5672' });
await rabbitMQ.connect();

// Create topic exchange
await rabbitMQ.createExchange({
  name: 'notifications',
  type: 'topic',
  durable: true
});

// Create queue for email notifications
await rabbitMQ.createQueue({ name: 'email-notifications', durable: true });

// Bind with pattern - receives all email.* notifications
await rabbitMQ.bindQueue('email-notifications', 'notifications', 'notification.email.*');

// Consumer receives messages matching the pattern
await consumer.consume({
  queue: 'email-notifications',
  exchange: 'notifications',
  routingKey: 'notification.email.*',  // Pattern used in binding
  onMessage: async (message) => {
    console.log('Email notification:', message);
    // Receives: notification.email.user, notification.email.admin, etc.
  }
});
```

### Complete Examples

#### Example 1: Simple Queue (No Exchange)

```typescript
import { rabbitMQ, producer, consumer } from '@developer-at/rabbit-mq';

async function setupSimpleQueue() {
  rabbitMQ.setConfig({
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672'
  });

  await rabbitMQ.connect();
  
  // Create queue
  await rabbitMQ.createQueue({
    name: 'user-events',
    durable: true
  });
  
  // Producer - send directly to queue (no exchange, no routing key)
  await producer.produce('user-events', {
    type: 'user.created',
    userId: '123',
    name: 'John Doe'
  });
  
  // Consumer - consume directly from queue (no exchange, no routing key)
  await consumer.consume({
    queue: 'user-events',
    prefetchCount: 5,
    onMessage: async (message) => {
      try {
        console.log('Processing:', message);
        await processUserEvent(message);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  });
}
```

#### Example 2: Exchange-Based with Routing Keys

```typescript
import { rabbitMQ, producer, consumer } from '@developer-at/rabbit-mq';

async function setupExchangeBased() {
  rabbitMQ.setConfig({
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672'
  });

  await rabbitMQ.connect();
  
  // Create exchange
  await rabbitMQ.createExchange({
    name: 'user-exchange',
    type: 'direct',
    durable: true
  });
  
  // Create queues
  await rabbitMQ.createQueue({ name: 'user-created-queue', durable: true });
  await rabbitMQ.createQueue({ name: 'user-updated-queue', durable: true });
  
  // Bind queues to exchange with routing keys
  await rabbitMQ.bindQueue('user-created-queue', 'user-exchange', 'user.created');
  await rabbitMQ.bindQueue('user-updated-queue', 'user-exchange', 'user.updated');
  
  // Producer - publish to exchange with routing key
  await producer.produce(
    'user-created-queue',
    { userId: '123', action: 'created', name: 'John Doe' },
    'user-exchange',    // Exchange name
    'user.created'      // Routing key - routes to user-created-queue
  );
  
  // Consumer - consume from queue bound to exchange
  await consumer.consume({
    queue: 'user-created-queue',
    exchange: 'user-exchange',      // Exchange name
    routingKey: 'user.created',      // Routing key used in binding
    prefetchCount: 5,
    onMessage: async (message) => {
      try {
        console.log('User created event:', message);
        await handleUserCreated(message);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await producer.disconnectAll();
  await consumer.disconnectConsumers();
  await rabbitMQ.disconnect();
  process.exit(0);
});
```

## API Reference

### `rabbitMQ` (singleton)

Default shared `RabbitMQManager` instance. Configure once:

```typescript
import { rabbitMQ } from '@developer-at/rabbit-mq';

rabbitMQ.setConfig({ url: 'amqp://localhost:5672' });
```

Producer and consumer services use `rabbitMQ` unless you pass another manager.

### RabbitMQManager

Connection and channel management. Use `new RabbitMQManager()` for additional brokers.

#### `setConfig(config: IRabbitMQConfig)`

Sets connection configuration on **this** instance.

**Parameters:**

- `config.url` (string): RabbitMQ connection URL
- `config.connectionOptions` (any, optional): Additional connection options

#### `isConfigured(): boolean`

Returns whether `setConfig` has been called on this instance.

#### `getUrl(): string | undefined`

Returns the configured URL (useful for debugging).

#### `connect()`

Establishes connection to RabbitMQ.

#### `disconnect()`

Closes the RabbitMQ connection.

#### `createQueue(queueConfig: IQueueConfig)`

Creates a queue if it doesn't exist. This method should be called after connecting to RabbitMQ.

**Parameters:**

- `queueConfig.name` (string): Queue name
- `queueConfig.durable` (boolean, optional): Queue survives broker restart (default: true)
- `queueConfig.exclusive` (boolean, optional): Queue is exclusive to connection (default: false)
- `queueConfig.autoDelete` (boolean, optional): Queue is deleted when unused (default: false)
- `queueConfig.arguments` (any, optional): Additional queue arguments

**Example:**

```typescript
await rabbitMQ.createQueue({
  name: 'my-queue',
  durable: true,
  exclusive: false,
  autoDelete: false
});
```

#### `createExchange(exchangeConfig: IExchangeConfig)`

Creates an exchange if it doesn't exist. This method should be called after connecting to RabbitMQ.

**Parameters:**

- `exchangeConfig.name` (string): Exchange name
- `exchangeConfig.type` ('direct' | 'topic' | 'fanout' | 'headers'): Exchange type
  - `direct`: Routes messages where routing key exactly matches binding key
  - `topic`: Routes messages using pattern matching (wildcards: `*`, `#`)
  - `fanout`: Broadcasts all messages to all bound queues (routing key ignored)
  - `headers`: Routes based on message headers
- `exchangeConfig.durable` (boolean, optional): Exchange survives broker restart (default: true)
- `exchangeConfig.autoDelete` (boolean, optional): Exchange is deleted when unused (default: false)
- `exchangeConfig.arguments` (any, optional): Additional exchange arguments

**Example:**

```typescript
await rabbitMQ.createExchange({
  name: 'my-exchange',
  type: 'direct',
  durable: true
});
```

#### `bindQueue(queueName: string, exchangeName: string, routingKey?: string)`

Binds a queue to an exchange with an optional routing key. The routing key determines which messages from the exchange are delivered to the queue.

**Parameters:**

- `queueName` (string): Name of the queue to bind
- `exchangeName` (string): Name of the exchange to bind to
- `routingKey` (string, optional): Routing key for message filtering (default: '')

**How Routing Works:**

- **Direct Exchange**: Routing key must exactly match the binding key
- **Topic Exchange**: Routing key can use wildcards (`*` for single word, `#` for multiple words)
- **Fanout Exchange**: Routing key is ignored, all messages go to all bound queues
- **Headers Exchange**: Routing key is ignored, routing is based on message headers

**Example:**

```typescript
// Direct exchange - exact match
await rabbitMQ.bindQueue('queue1', 'exchange1', 'user.created');

// Topic exchange - pattern matching
await rabbitMQ.bindQueue('queue2', 'exchange2', 'user.*');  // Matches user.created, user.updated, etc.
await rabbitMQ.bindQueue('queue3', 'exchange2', 'user.#');  // Matches user.created, user.profile.updated, etc.

// Fanout exchange - routing key ignored
await rabbitMQ.bindQueue('queue4', 'exchange3', '');  // All messages received
```

### Producer Service

#### `produce(queue: string, message: any, exchange?: string, routingKey?: string)`

Publishes a message to a queue or exchange.

**Parameters:**

- `queue` (string): Queue name (used as reference, actual routing depends on exchange/routing key)
- `message` (any): Message payload (will be JSON stringified)
- `exchange` (string, optional): Exchange name. If provided, message is published to exchange with routing key
- `routingKey` (string, optional): Routing key for exchange. Required when using exchange

**Usage Patterns:**

1. **Direct Queue (No Exchange):**

   ```typescript
   // Message sent directly to queue
   await producer.produce('my-queue', { data: 'value' });
   ```
2. **With Exchange and Routing Key:**

   ```typescript
   // Message published to exchange, routed to queues based on routing key
   await producer.produce('my-queue', { data: 'value' }, 'my-exchange', 'routing.key');
   ```

**Important Notes:**

- When using an exchange, the routing key determines which bound queues receive the message
- The queue parameter is used as a reference but doesn't affect routing when using an exchange
- For fanout exchanges, routing key is ignored and all bound queues receive the message

#### `disconnectAll()`

Disconnects all active producers.

#### `getProducerCount(): number`

Returns the number of active producers.

#### `getProducerKeys(): string[]`

Returns all producer keys.

### Consumer Service

#### `consume(options: IRabbitMQConsumerOptions)`

Starts consuming messages from a queue. If the queue is bound to an exchange, you must specify the exchange and routing key that was used in the binding.

**Parameters:**

- `options.queue` (string): Queue name to consume from
- `options.exchange` (string, optional): Exchange name the queue is bound to. Required if queue is bound to an exchange
- `options.routingKey` (string, optional): Routing key used in the queue binding. Required if queue is bound to an exchange
- `options.onMessage` (function): Async function to handle messages. Receives parsed message object
- `options.prefetchCount` (number, optional): Number of unacknowledged messages to process concurrently (default: 1)
- `options.durable` (boolean, optional): Queue durability (default: true)
- `options.exclusive` (boolean, optional): Queue exclusivity (default: false)
- `options.autoDelete` (boolean, optional): Auto-delete queue when unused (default: false)

**Usage Patterns:**

1. **Direct Queue (No Exchange):**

   ```typescript
   await consumer.consume({
     queue: 'my-queue',
     onMessage: async (message) => {
       // Process message
     }
   });
   ```
2. **Queue Bound to Exchange:**

   ```typescript
   await consumer.consume({
     queue: 'my-queue',
     exchange: 'my-exchange',      // Must match the exchange used in binding
     routingKey: 'routing.key',    // Must match the routing key used in binding
     onMessage: async (message) => {
       // Process message
     }
   });
   ```

**Important Notes:**

- If a queue is bound to an exchange, you MUST specify both `exchange` and `routingKey` in the consume options
- The `exchange` and `routingKey` must match the values used when binding the queue to the exchange
- For queues not bound to an exchange, omit `exchange` and `routingKey` parameters

#### `disconnectConsumers()`

Disconnects all active consumers.

#### `getConsumerCount(): number`

Returns the number of active consumers.

#### `getConsumerTags(): string[]`

Returns all consumer tags.

## Message Handling

- Messages are automatically acknowledged on successful processing
- Messages are automatically nacked (not requeued) on error
- Use `prefetchCount` to control concurrency
- Messages are JSON stringified when publishing and parsed when consuming

## Error Handling

The package includes automatic error handling:

- Connection errors are logged
- Failed messages are nacked (not requeued)
- Automatic reconnection on connection loss

## TypeScript Support

Full TypeScript definitions are included. Import interfaces for type safety:

```typescript
import {
  IRabbitMQConfig,
  IRabbitMQConsumerOptions,
  IRabbitMQProducerOptions,
  IRabbitMQMessage
} from '@developer-at/rabbit-mq';
```

## Dependencies

- `amqplib`: ^0.10.9

## License

ISC
