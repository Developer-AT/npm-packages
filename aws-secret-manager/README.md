# @developer-at/aws-secret-manager

AWS Secrets Manager client package for Node.js applications. Provides an easy-to-use interface for retrieving secrets from AWS Secrets Manager.

## Installation

```bash
npm install @developer-at/aws-secret-manager
```

## Features

- Simple API for loading and retrieving secrets
- Automatic AWS SDK client initialization
- **Fallback:** `setSecretsFromJson()` to load secrets from a local JSON object or string (dev / offline / backup)
- TypeScript support
- Error handling

## Prerequisites

- AWS account with Secrets Manager access
- AWS credentials configured (via environment variables, IAM role, or AWS credentials file)
- `AWS_REGION` environment variable set

## AWS Setup

1. Create a secret in AWS Secrets Manager
2. Ensure your AWS credentials have permissions to access Secrets Manager
3. Set the `AWS_REGION` environment variable

### Required IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:*"
    }
  ]
}
```

## Usage

### Basic Setup

```typescript
import { secret } from '@developer-at/aws-secret-manager';

// Set AWS region (required)
process.env.AWS_REGION = 'us-east-1';

// Load secrets from AWS Secrets Manager
await secret.loadCreds('my-secret-name');

// Retrieve a secret value
const dbPassword = secret.get('dbPassword');
const apiKey = secret.get('apiKey');

console.log('Database Password:', dbPassword);
console.log('API Key:', apiKey);
```

### Fallback: local JSON (`setSecretsFromJson`)

When AWS is unavailable, for local development, or as a backup after `loadCreds` fails, you can assign the same key/value shape as your secret JSON **without** calling AWS:

**From an object:**

```typescript
import { secret } from '@developer-at/aws-secret-manager';

secret.setSecretsFromJson({
  DB_HOST: 'localhost',
  DB_PASSWORD: 'dev-only',
  API_KEY: 'local-key'
});

const host = secret.get('DB_HOST');
```

**From a JSON string:**

```typescript
secret.setSecretsFromJson('{"JWT_SECRET":"dev-secret","API_KEY":"local"}');
```

**Try AWS first, then fallback:**

```typescript
try {
  await secret.loadCreds('my-application-secrets');
} catch {
  secret.setSecretsFromJson({
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PASSWORD: process.env.DB_PASSWORD || ''
  });
}
```

Notes:

- Calling `setSecretsFromJson` **replaces** `this.secrets` for that singleton instance. If you later call `loadCreds` successfully, AWS values replace the fallback.
- Invalid JSON string throws the same structured `SecretsManagerException` pattern as other operations (see Error Handling).
- Non-object JSON (e.g. array or bare string) is rejected with a clear error.

### Complete Example

```typescript
import { secret } from '@developer-at/aws-secret-manager';

async function initializeApp() {
  try {
    // Load secrets from AWS
    await secret.loadCreds('my-application-secrets');
    
    // Retrieve configuration values
    const config = {
      database: {
        host: secret.get('DB_HOST'),
        port: secret.get('DB_PORT'),
        username: secret.get('DB_USERNAME'),
        password: secret.get('DB_PASSWORD'),
        name: secret.get('DB_NAME')
      },
      api: {
        key: secret.get('API_KEY'),
        secret: secret.get('API_SECRET')
      },
      jwt: {
        secret: secret.get('JWT_SECRET')
      }
    };
    
    // Use configuration
    console.log('Application configured successfully');
    return config;
    
  } catch (error) {
    console.error('Failed to load secrets:', error);
    throw error;
  }
}

// Initialize on application startup
initializeApp()
  .then(() => {
    console.log('App started');
  })
  .catch((error) => {
    console.error('Failed to start app:', error);
    process.exit(1);
  });
```

### Express.js Integration Example

```typescript
import express from 'express';
import { secret } from '@developer-at/aws-secret-manager';

const app = express();

// Load secrets on startup
async function loadSecrets() {
  try {
    await secret.loadCreds(process.env.SECRET_NAME || 'my-app-secrets');
    
    // Access secrets throughout the application
    const jwtSecret = secret.get('JWT_SECRET');
    const dbConfig = {
      host: secret.get('DB_HOST'),
      password: secret.get('DB_PASSWORD')
    };
    
    console.log('Secrets loaded successfully');
  } catch (error) {
    console.error('Failed to load secrets:', error);
    process.exit(1);
  }
}

// Initialize before starting server
loadSecrets().then(() => {
  app.listen(3000, () => {
    console.log('Server started on port 3000');
  });
});
```

### Using AWSSecretManagerProvider Class Directly

```typescript
import { AWSSecretManagerProvider } from '@developer-at/aws-secret-manager';

// Create a custom instance
const customSecret = new AWSSecretManagerProvider();

// Load and use secrets
await customSecret.loadCreds('my-custom-secret');
const value = customSecret.get('myKey');
```

## API Reference

### `secret` (Singleton Instance)

Pre-configured secret manager instance ready to use.

### `AWSSecretManagerProvider` Class

Main secret manager provider class.

#### `constructor()`

Initializes a new AWS Secrets Manager provider instance. Automatically initializes the AWS SDK client.

#### `initializeSecretManager()`

Initializes the AWS Secrets Manager client. Called automatically in the constructor.

#### `loadCreds(secretName: string)`

Loads secrets from AWS Secrets Manager.

**Parameters:**
- `secretName` (string): Name or ARN of the secret in AWS Secrets Manager

**Returns:**
- `Promise<void>`

**Throws:**
- Error if secret cannot be loaded or parsed

**Example:**
```typescript
await secret.loadCreds('production/database/credentials');
```

#### `setSecretsFromJson(payload: Record<string, unknown> | string)`

Assigns secrets from a plain object or a JSON string (fallback / local / offline). Same usage as `get()` after `loadCreds`.

**Parameters:**

- `payload` — Object of key/value pairs, or a JSON string that parses to a **non-null object** (not an array).

**Returns:**

- `void`

**Throws:**

- Structured error if the string is not valid JSON or does not parse to an object.

**Example:**

```typescript
secret.setSecretsFromJson({ API_KEY: 'local' });
// or
secret.setSecretsFromJson('{"API_KEY":"local"}');
```

#### `get(key: string)`

Retrieves a secret value by key.

**Parameters:**
- `key` (string): Key name in the secret JSON

**Returns:**
- `any`: Secret value or undefined if key not found

**Example:**
```typescript
const password = secret.get('password');
const config = secret.get('database');
```

## Secret Format

Secrets in AWS Secrets Manager should be stored as JSON strings. For example:

```json
{
  "DB_HOST": "database.example.com",
  "DB_PORT": "5432",
  "DB_USERNAME": "admin",
  "DB_PASSWORD": "secure-password",
  "API_KEY": "api-key-12345",
  "JWT_SECRET": "jwt-secret-key"
}
```

## Environment Variables

- `AWS_REGION` (required): AWS region where your secrets are stored (e.g., `us-east-1`)

## Error Handling

The package includes structured error handling with `SecretsManagerException` class. All errors are automatically categorized and returned in a consistent format:

```typescript
import { secret, SecretsManagerException } from '@developer-at/aws-secret-manager';

try {
    await secret.loadCreds('my-secret-name');
} catch (error) {
    if (error instanceof SecretsManagerException) {
        const errorResponse = error.getError();
        // Returns: { status: 404, data: { message, type, originalError, context, ... } }
    }
}
```

Error types include: Connection, Authentication, Not Found, Validation, Timeout, Server, and Operation errors.

## TypeScript Support

The package includes full TypeScript definitions and is written in TypeScript.

## Dependencies

- `@aws-sdk/client-secrets-manager`: ^3.972.0

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use IAM roles** when running on AWS infrastructure (EC2, ECS, Lambda)
3. **Rotate secrets regularly** in AWS Secrets Manager
4. **Use least privilege IAM policies** for Secrets Manager access
5. **Load secrets at application startup** rather than on-demand
6. **Don't log secret values** in your application logs

## Troubleshooting

### Common Issues

1. **"Unable to Connect Error"**
   - Verify AWS credentials are configured
   - Check AWS_REGION environment variable is set
   - Ensure IAM permissions are correct

2. **"Unable to Load credentials AWS Error"**
   - Verify secret name/ARN is correct
   - Check secret exists in the specified region
   - Ensure IAM user/role has `secretsmanager:GetSecretValue` permission

3. **"undefined" when calling `get()`**
   - Ensure `loadCreds()` or `setSecretsFromJson()` ran successfully
   - Verify the key exists in the secret JSON
   - Check key name spelling

## License

ISC
