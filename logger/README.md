# @developer-at/logger

A reusable Winston logger package with context support for Node.js services. Provides structured logging with trace ID, user ID, and request source tracking.

## Installation

```bash
npm install @developer-at/logger
```

## Features

- Winston-based logging with console transport
- Context-aware logging (trace ID, user ID, request source)
- **Plain logging:** `pInfo`, `pWarn`, `pError` — same Winston pipeline but **no** `{ trace, logs }` wrapper; all arguments are collected into one array and passed through to Winston as-is
- Structured log output with timestamps
- Service name labeling
- TypeScript support

## Usage

### Basic Setup

```typescript
import { logger } from '@developer-at/logger';

// Set environment variable for service name (optional)
process.env.SERVICE_NAME = 'my-service';

// Basic logging
logger.info('Application started');
logger.warn('This is a warning');
logger.error('An error occurred');
```

### With Context Information

```typescript
import { logger } from '@developer-at/logger';

// Set context information
logger.setTraceId('trace-123-456');
logger.setUserId('user-789');
logger.setRequestFrom('API');

// Log with context
logger.info('User logged in', { userId: 'user-789' });
logger.error('Failed to process request', { error: 'Database connection failed' });
```

### Plain logging (`pInfo`, `pWarn`, `pError`)

Use these when you want logs **without** the structured context object (`trace`, `userId`, `requestFrom`). Each call forwards **one value** to Winston: an **array of every argument** you passed, in order. Nothing is stringified or merged for you; objects, errors, and primitives stay as you passed them (subject to how Winston / JSON serialization represent them in output).

Structured methods (`info`, `warn`, `error`) always emit `{ trace, logs }` where `logs` is your argument list. Plain methods skip that wrapper entirely.

Winston still applies your configured format (`json` / `pretty`) and default metadata (for example `service` / `label`).

```typescript
// Multiple arguments become one array payload for Winston
logger.pInfo('Server listening on', 3000);
// Conceptually similar to: winston.info(['Server listening on', 3000])

logger.pWarn('Deprecated option', { key: 'oldFlag' });

logger.pError('Something failed', new Error('timeout'));

// Single argument → array of one element
logger.pInfo({ event: 'boot', version: '1.0.0' });
```

**When to use which**

| Method   | Context fields (`traceId`, `userId`, `requestFrom`) | Payload shape                          |
|----------|--------------------------------------------------------|----------------------------------------|
| `info` … | Included in `trace`                                    | `{ trace, logs }`                      |
| `pInfo` …| Not attached                                           | `[ ...yourArgs ]` as the logged message |

### Express.js Integration Example

```typescript
import express from 'express';
import { logger } from '@developer-at/logger';

const app = express();

// Middleware to set trace context
app.use((req, res, next) => {
  const traceId = req.headers['x-trace-id'] as string || `trace-${Date.now()}`;
  const userId = req.headers['x-user-id'] as string;
  
  logger.setTraceId(traceId);
  if (userId) logger.setUserId(userId);
  logger.setRequestFrom('API');
  
  next();
});

app.get('/users', (req, res) => {
  logger.info('Fetching users');
  // ... your logic
  logger.info('Users fetched successfully');
  res.json({ users: [] });
});
```

### Using LoggerUtils Class Directly

```typescript
import { LoggerUtils } from '@developer-at/logger';

// Create a custom logger instance
const customLogger = new LoggerUtils();
customLogger.setTraceId('custom-trace');
customLogger.setUserId('custom-user');
customLogger.setRequestFrom('Worker');

customLogger.info('Processing job');
customLogger.error('Job failed', { error: 'Timeout' });
```

## API Reference

### `logger` (Singleton Instance)

Pre-configured logger instance ready to use.

### `LoggerUtils` Class

Main logger utility class.

#### `constructor()`

Initializes a new LoggerUtils instance with Winston logger.

#### `setTraceId(traceId: string)`

Sets the trace ID for request tracking.

**Parameters:**
- `traceId` (string): Unique trace identifier

#### `setUserId(userId: string)`

Sets the user ID for logging context.

**Parameters:**
- `userId` (string): User identifier

#### `setRequestFrom(requestFrom: string)`

Sets the request source for logging context.

**Parameters:**
- `requestFrom` (string): Source of the request (e.g., 'API', 'Worker', 'Cron')

#### `getTraceId(): string | undefined`

Returns the current trace ID, if any was set with `setTraceId`.

#### `getUserId(): string | undefined`

Returns the current user ID, if any was set with `setUserId`.

#### `getRequestFrom(): string | undefined`

Returns the current request source, if any was set with `setRequestFrom`.

#### `info(...logs: any[])`

Logs an informational message.

**Parameters:**
- `...logs` (any[]): One or more log messages or objects

**Example:**
```typescript
logger.info('User created', { userId: '123', email: 'user@example.com' });
```

#### `warn(...logs: any[])`

Logs a warning message.

**Parameters:**
- `...logs` (any[]): One or more log messages or objects

**Example:**
```typescript
logger.warn('Rate limit approaching', { current: 90, limit: 100 });
```

#### `error(...logs: any[])`

Logs an error message.

**Parameters:**
- `...logs` (any[]): One or more log messages or objects

**Example:**
```typescript
logger.error('Database connection failed', { error: error.message, stack: error.stack });
```

#### `pInfo(...logs: any[])`

Plain informational log at Winston level `info`. Does **not** wrap output in `{ trace, logs }`. All arguments are gathered into `[...logs]` and that array is what Winston receives as the log message payload.

**Parameters:**

- `...logs` (any[]): Any values you want on the log line; order is preserved in the array.

**Example:**

```typescript
logger.pInfo('ready', { port: 8080 });
// Winston sees a single payload: ['ready', { port: 8080 }]
```

#### `pWarn(...logs: any[])`

Same as `pInfo`, but at Winston level `warn`.

#### `pError(...logs: any[])`

Same as `pInfo`, but at Winston level `error`.

## Configuration

### Environment Variables

- `SERVICE_NAME`: Service name to include in log labels (optional, defaults to empty string)
- `LOG_OUTPUT_FORMAT`: Log output mode (optional)
  - `pretty`: human-readable structured logs (can be multiline)
  - `json`: single-line JSON output
  - `minified`: single-line JSON output
  - default: `json`

### Log Format

Logs are output in the following format:
- **Label**: Service name (from `SERVICE_NAME` env var)
- **Timestamp**: ISO-8601 format (e.g. `2026-03-13T10:21:45.123Z`)
- **Level**: Log level (info, warn, error)
- **Trace**: Object containing traceId, userId, and requestFrom
- **Logs**: Array of log messages/objects

### CloudWatch Friendly Mode (Single Line)

Set:

```bash
LOG_OUTPUT_FORMAT=json
```

or

```bash
LOG_OUTPUT_FORMAT=minified
```

Both output one JSON object per line, which is easier to query in CloudWatch.

### Pretty Mode (Local Debugging)

Set:

```bash
LOG_OUTPUT_FORMAT=pretty
```

This keeps a more readable format and may span multiple lines.

### Example Log Output (JSON/Minified)

```json
{
  "level": "info",
  "message": "",
  "label": "my-service",
  "timestamp": "2026-03-13T10:21:45.123Z",
  "trace": {
    "traceId": "trace-123-456",
    "userId": "user-789",
    "requestFrom": "API"
  },
  "logs": [
    "User logged in",
    {
      "userId": "user-789",
      "action": "login"
    }
  ]
}
```

## TypeScript Support

The package includes full TypeScript definitions and is written in TypeScript.

## Dependencies

- `winston`: ^3.19.0

## License

ISC
