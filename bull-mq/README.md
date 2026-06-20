# @appinventiv/bull-mq

BullMQ wrapper for Node.js with the same architectural style as `@appinventiv/rabbit-mq`: singleton manager, composable queue/worker/job layers, and Redis injected from your application.

## Installation

```bash
npm install @appinventiv/bull-mq ioredis
```

## Features

- Default `bullMQ` singleton with optional custom `BullMQManager` instances
- **Queue** — pooled queue wrappers per queue name
- **Worker** — start processors with concurrency
- **Job** — `add`, `addBulk`, and **scheduler** (`upsertJobScheduler`)
- Built-in **Redis connection** module (`connection/redis`) with read/write replica support
- Redis connection passed from outside or via `initFromRedisConfig`
- TypeScript support

## Prerequisites

- Redis server accessible from your app
- An `ioredis` client (or `RedisOptions`) you create and own

## Usage

### Basic setup (package Redis connection)

```typescript
import { bullMQ, job, worker, queue } from '@appinventiv/bull-mq';

bullMQ.initFromRedisConfig({
  readReplicaHost: 'localhost',
  readReplicaPort: 6379,
  writeReplicaHost: 'localhost',
  writeReplicaPort: 6379,
  db: 0
});

bullMQ.setPrefix('{myapp}'); // optional
bullMQ.setDefaultJobOptions({ attempts: 3 }); // optional

await job.add('notifications', 'send-email', { to: 'user@example.com' });

await worker.startWorker({
  queueName: 'notifications',
  processor: async (bullJob) => {
    console.log('Processing', bullJob.data);
  },
  concurrency: 5
});

await job.schedule(
  'notifications',
  'hourly-digest',
  { every: 3600000 },
  { name: 'digest', data: { type: 'hourly' } }
);
```

### Basic setup (external ioredis client)

```typescript
import { Redis } from 'ioredis';
import { bullMQ, job, worker, queue } from '@appinventiv/bull-mq';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null // required for BullMQ blocking workers
});

bullMQ.setConnection(redis);
bullMQ.setPrefix('{myapp}'); // optional
bullMQ.setDefaultJobOptions({ attempts: 3 }); // optional

// Enqueue a job
await job.add('notifications', 'send-email', { to: 'user@example.com' });

// Process jobs
await worker.startWorker({
  queueName: 'notifications',
  processor: async (bullJob) => {
    console.log('Processing', bullJob.data);
  },
  concurrency: 5
});

// Repeatable / scheduled job
await job.schedule(
  'notifications',
  'hourly-digest',
  { every: 3600000 },
  { name: 'digest', data: { type: 'hourly' } }
);
```

### Alternate Redis instance

```typescript
import { BullMQManager, job } from '@appinventiv/bull-mq';

const analyticsRedis = new Redis({
  host: 'analytics-redis',
  port: 6379,
  maxRetriesPerRequest: null
});
const analyticsMq = new BullMQManager();
analyticsMq.setConnection(analyticsRedis);

await job.add('events', 'track', { event: 'click' }, undefined, analyticsMq);
```

## Scheduled and delayed jobs

BullMQ supports two related patterns:

| Pattern | Method | When to use |
|---------|--------|-------------|
| **One-off delayed job** | `job.add(..., { delay })` | Run once after N milliseconds |
| **Repeating / cron job** | `job.schedule(...)` | Run on an interval or cron pattern (uses `upsertJobScheduler`) |

A **worker must be running** on the same `queueName` for scheduled jobs to be processed.

### One-off delayed job

```typescript
// Run once after 30 seconds
await job.add(
  'notifications',
  'send-reminder',
  { userId: '42', message: 'Complete your profile' },
  { delay: 30_000 }
);
```

### Repeating job — fixed interval (`every`)

```typescript
// Every hour (milliseconds)
await job.schedule(
  'notifications',           // queueName
  'hourly-digest',           // schedulerId — unique id for this schedule
  { every: 3_600_000 },      // repeat — run every 1 hour
  {
    name: 'digest',            // jobTemplate.name — job name each run uses
    data: { type: 'hourly' }, // jobTemplate.data — payload passed to processor
    opts: { attempts: 3 }      // jobTemplate.opts — per-run job options (optional)
  }
);
```

### Repeating job — cron pattern

```typescript
// Every day at midnight (server timezone / cron-parser rules)
await job.schedule(
  'reports',
  'daily-report',
  { pattern: '0 0 * * *' },
  {
    name: 'generate-report',
    data: { reportType: 'daily' },
    opts: {
      removeOnComplete: true,
      removeOnFail: 50
    }
  }
);
```

### Cron with immediate first run

```typescript
await job.schedule(
  'sync',
  'sync-users',
  {
    pattern: '0 */6 * * *', // every 6 hours
    immediately: true       // also enqueue one run right now
  },
  { name: 'sync-users', data: { source: 'crm' } }
);
```

### Limit how many times a schedule runs

```typescript
await job.schedule(
  'onboarding',
  'welcome-series',
  { every: 86_400_000, limit: 7 }, // once per day, max 7 times
  { name: 'welcome-email', data: { step: 1 } }
);
```

### Remove a schedule

```typescript
await job.removeSchedule('notifications', 'hourly-digest');
```

### Full example: schedule + worker

```typescript
import { bullMQ, job, worker } from '@appinventiv/bull-mq';

bullMQ.initFromRedisConfig({
  readReplicaHost: 'localhost',
  readReplicaPort: 6379,
  writeReplicaHost: 'localhost',
  writeReplicaPort: 6379,
  db: 0
});

// 1. Register worker first (same queue name as schedule)
await worker.startWorker({
  queueName: 'notifications',
  processor: async (bullJob) => {
    if (bullJob.name === 'digest') {
      await sendDigestEmail(bullJob.data);
    }
  },
  concurrency: 2
});

// 2. Register repeatable schedule
await job.schedule(
  'notifications',
  'hourly-digest',
  { every: 3_600_000 },
  { name: 'digest', data: { type: 'hourly' } }
);
```

---

## Job API parameters

### `job.add(queueName, jobName, data, opts?, bullMq?)`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `queueName` | `string` | Yes | BullMQ queue name. Jobs land here; worker must listen on the same name. |
| `jobName` | `string` | Yes | Logical job name (e.g. `'send-email'`). Your processor can branch on `job.name`. |
| `data` | `any` | Yes | JSON-serializable payload available as `job.data` in the processor. |
| `opts` | `JobsOptions` | No | Per-job options (see below). |
| `bullMq` | `BullMQManager` | No | Override Redis manager; defaults to `bullMQ` singleton. |

**Common `opts` (one-off jobs):**

| Option | Type | Description |
|--------|------|-------------|
| `delay` | `number` | Milliseconds to wait before the job becomes active. |
| `attempts` | `number` | Max retry attempts (default `1`). |
| `backoff` | `number \| object` | Delay strategy between retries. |
| `priority` | `number` | Lower number = higher priority (0 is highest). |
| `jobId` | `string` | Custom job id; must be unique in the queue. |
| `removeOnComplete` | `boolean \| number \| object` | Remove or cap completed jobs in Redis. |
| `removeOnFail` | `boolean \| number \| object` | Remove or cap failed jobs in Redis. |
| `lifo` | `boolean` | If `true`, add to front of queue (LIFO). |

```typescript
await job.add('orders', 'process-order', { orderId: '99' }, {
  delay: 5_000,
  attempts: 5,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: 100,
  removeOnFail: 50
});
```

### `job.schedule(queueName, schedulerId, repeat, jobTemplate?, bullMq?)`

Wraps BullMQ [`upsertJobScheduler`](https://docs.bullmq.io/guide/job-schedulers). Creates or updates a **repeatable** schedule; each tick enqueues a job from `jobTemplate`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `queueName` | `string` | Yes | Queue that receives scheduled job instances. |
| `schedulerId` | `string` | Yes | Stable id for this schedule. Re-calling `schedule` with the same id **updates** the schedule. |
| `repeat` | `RepeatOptions` | Yes | When to run (interval or cron). See table below. |
| `jobTemplate` | `object` | No | Template for each generated job. |
| `jobTemplate.name` | `string` | No | Job name for each run (processor sees `job.name`). |
| `jobTemplate.data` | `any` | No | Payload for each run (`job.data`). |
| `jobTemplate.opts` | `JobSchedulerTemplateOptions` | No | Per-run options (`attempts`, `removeOnComplete`, etc.). Cannot include `delay`, `repeat`, or `jobId`. |
| `bullMq` | `BullMQManager` | No | Optional manager override. |

**`repeat` options (`RepeatOptions`):**

| Option | Type | Description |
|--------|------|-------------|
| `every` | `number` | Repeat every N **milliseconds**. Do not use with `pattern`. |
| `pattern` | `string` | Cron expression (e.g. `'0 0 * * *'`). Do not use with `every`. |
| `limit` | `number` | Stop after this many repetitions. |
| `immediately` | `boolean` | With cron `pattern`, enqueue one run immediately. |
| `count` | `number` | Start value for repeat iteration count. |
| `offset` | `number` | Offset in ms affecting next iteration time. |
| `tz` | `string` | Timezone for cron (via `cron-parser`; see BullMQ docs). |

**Notes:**

- Use **`every`** for simple intervals (e.g. every 5 minutes → `300_000`).
- Use **`pattern`** for calendar-style schedules (cron).
- **`schedulerId`** should be unique per schedule on a queue; use it with `job.removeSchedule()` to delete.
- Changing `repeat` or `jobTemplate` and calling `schedule` again updates the existing scheduler.

### `job.removeSchedule(queueName, schedulerId, bullMq?)`

Removes a previously registered scheduler. Does not remove jobs already in the queue.

### `job.addBulk(queueName, jobs, bullMq?)`

| `jobs[]` field | Description |
|----------------|-------------|
| `name` | Job name |
| `data` | Payload |
| `opts` | Optional `JobsOptions` per job |

```typescript
await job.addBulk('notifications', [
  { name: 'send-email', data: { to: 'a@example.com' } },
  { name: 'send-email', data: { to: 'b@example.com' }, opts: { priority: 1 } }
]);
```

### Shutdown

`worker.stopWorkers()` and `queue.disconnectAll()` close BullMQ queue/worker instances.

When using `initFromRedisConfig`, also disconnect the package Redis module:

```typescript
await worker.stopWorkers();
await queue.disconnectAll();
await bullMQ.disconnect();
await redisConnection.disconnect();
```

When using an external ioredis client:

```typescript
await worker.stopWorkers();
await queue.disconnectAll();
await bullMQ.disconnect();
await redis.quit();
```

## API overview

| Export | Role |
|--------|------|
| `bullMQ` | Default manager — `initFromRedisConfig()` or `setConnection(redis)` |
| `redisConnection` | Redis read/write clients (`getConnection()` → write client for BullMQ) |
| `RedisConnection` | Custom Redis connection instance |
| `BullMQManager` | Custom manager for a second Redis |
| `queue` | Pooled `BullMQQueue` instances |
| `worker` | Register workers |
| `job` | Add / schedule jobs |
| `BullMQQueue`, `BullMQWorker`, `BullMQJob` | Low-level wrappers |

### BullMQManager

- `initFromRedisConfig(config)` — create Redis via `redisConnection` and bind write client
- `setConnection(connection)` — use an existing ioredis client
- `setPrefix(prefix)` — optional BullMQ key prefix
- `setDefaultJobOptions(opts)` — merged into queue defaults
- `isConfigured()` — whether connection was set
- `getQueueOptions()` / `getWorkerOptions()` — used internally by wrappers

### RedisConnection (`redisConnection`)

- `initiateRedisConnection(config)` — create read/write clients
- `getWriteClient()` / `getConnection()` — write client for BullMQ (created with `maxRetriesPerRequest: null`)
- `getReadClient()` — read replica client
- `disconnect()` — quit both clients

**Note:** The write client sets `maxRetriesPerRequest: null` automatically. BullMQ workers rely on blocking Redis commands; a finite retry limit causes ioredis to fail those waits. If you use `bullMQ.setConnection()` with your own ioredis instance, set `maxRetriesPerRequest: null` on that client too.

### JobService (`job`)

- `add(queueName, jobName, data, opts?, bullMq?)` — enqueue a one-off (or delayed) job
- `addBulk(queueName, jobs, bullMq?)` — enqueue many jobs at once
- `schedule(queueName, schedulerId, repeat, jobTemplate?, bullMq?)` — repeatable / cron schedule
- `removeSchedule(queueName, schedulerId, bullMq?)` — remove a scheduler
- `getJob(queueName, jobId, bullMq?)` — fetch a job by id

See [Scheduled and delayed jobs](#scheduled-and-delayed-jobs) and [Job API parameters](#job-api-parameters) for examples and field descriptions.

### WorkerService (`worker`)

- `startWorker({ queueName, processor, concurrency?, workerOptions?, bullMq? })`
- `stopWorkers()` / `disconnectWorkers()`

### QueueService (`queue`)

- `getQueue(queueName, bullMq?)`
- `disconnectAll()`

## Comparison with rabbit-mq

| rabbit-mq | bull-mq |
|-----------|---------|
| `rabbitMQ.setConfig({ url })` | `bullMQ.initFromRedisConfig(config)` or `bullMQ.setConnection(redis)` |
| `producer.produce(queue, msg)` | `job.add(queueName, jobName, data)` |
| `consumer.consume({ queue, onMessage })` | `worker.startWorker({ queueName, processor })` |
| N/A | `job.schedule(...)` |

## License

ISC
