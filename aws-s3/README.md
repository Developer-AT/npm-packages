# @appinventiv/aws-s3

A comprehensive AWS S3 client package for Node.js applications. Provides easy-to-use methods for uploading, reading, deleting files, and generating presigned URLs for both S3 and CloudFront.

## Installation

```bash
npm install @appinventiv/aws-s3
```

## Features

- Upload files to S3 using presigned URLs
- Read files from S3 buckets
- Delete files from S3 buckets
- Generate S3 presigned URLs for uploads
- Generate CloudFront signed URLs for secure file access
- Generate CloudFront signed cookies for folder access
- Get file content as Base64 encoded string
- Support for private key loading from local filesystem or S3

## Prerequisites

- AWS account with S3 access
- AWS credentials configured (via environment variables, IAM role, or AWS credentials file)
- `AWS_REGION` environment variable set
- (Optional) CloudFront distribution for signed URL generation

## AWS Setup

1. Create an S3 bucket in AWS
2. Ensure your AWS credentials have permissions to access S3
3. Set the `AWS_REGION` environment variable
4. (Optional) Configure CloudFront distribution for signed URLs

### Required IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

## Usage

### Basic Setup

```typescript
import { s3Service } from '@appinventiv/aws-s3';

// Set AWS region (required)
process.env.AWS_REGION = 'us-east-1';

// Initialize S3 service
s3Service.initialiseS3Manager({
  cloudfrontDomain: 'https://d1234567890.cloudfront.net',  // Optional
  cloudfrontKeyPairId: 'APKAIOSFODNN7EXAMPLE'              // Optional
});
```

### Generate Presigned URL for Upload

Generate a presigned URL that allows clients to upload files directly to S3:

```typescript
import { s3Service } from '@appinventiv/aws-s3';

// Initialize S3 service
s3Service.initialiseS3Manager();

// Generate presigned URL for file upload
const presignedUrl = await s3Service.getPreSignedUrl(
  'my-bucket',           // Bucket name
  'uploads/images',      // Base path/folder
  'photo.jpg',           // File name
  3600                   // Expiration in seconds (1 hour)
);

console.log('Presigned URL:', presignedUrl);

// Client can now upload file using this URL
// Example: PUT request to presignedUrl with file in body
```

### Read File from S3

Read a file directly from S3 bucket:

```typescript
import { s3Service } from '@appinventiv/aws-s3';

// Initialize S3 service
s3Service.initialiseS3Manager();

// Read file content
const fileContent = await s3Service.readFile(
  'uploads/images/photo.jpg',  // S3 object key
  'my-bucket',                  // Bucket name
  'utf-8'                       // Optional encoding (default: UTF-8)
);

console.log('File content:', fileContent);
```

### Delete File from S3

Delete a file from S3 bucket:

```typescript
import { s3Service } from '@appinventiv/aws-s3';

// Initialize S3 service
s3Service.initialiseS3Manager();

// Delete file
await s3Service.deleteFile(
  'my-bucket',                  // Bucket name
  'uploads/images/photo.jpg'    // S3 object key
);

console.log('File deleted successfully');
```

### Get File as Base64

Get file content as Base64 encoded string:

```typescript
import { s3Service } from '@appinventiv/aws-s3';

// Initialize S3 service
s3Service.initialiseS3Manager();

// Get file as Base64
const base64Data = await s3Service.getFileBase64Data({
  bucket: 'my-bucket',
  path: 'uploads/images/photo.jpg'
});

console.log('Base64 data:', base64Data);
// Use this for embedding in HTML, sending via API, etc.
```

### CloudFront Signed URLs

Generate CloudFront signed URLs for secure file access:

#### Setup CloudFront Private Key

First, load the CloudFront private key:

```typescript
import { s3Service } from '@appinventiv/aws-s3';

// Load private key from local filesystem
await s3Service.loadConfigForReadablePresignedUrl(
  '/path/to/private-key.pem',  // Local file path
  false                         // Not stored on S3
);

// Or load private key from S3
await s3Service.loadConfigForReadablePresignedUrl(
  'keys/cloudfront-private-key.pem',  // S3 key
  true,                                // Stored on S3
  'my-config-bucket'                   // S3 bucket name
);
```

#### Generate CloudFront Signed URL for File

```typescript
import { s3Service } from '@appinventiv/aws-s3';

// Initialize with CloudFront config
s3Service.initialiseS3Manager({
  cloudfrontDomain: 'https://d1234567890.cloudfront.net',
  cloudfrontKeyPairId: 'APKAIOSFODNN7EXAMPLE'
});

// Load private key
await s3Service.loadConfigForReadablePresignedUrl(
  '/path/to/private-key.pem',
  false
);

// Generate signed URL for a file
const signedUrl = await s3Service.getPreSignedUrlToReadFile(
  '/uploads/images/photo.jpg',  // File path (relative to CloudFront domain)
  3600000                       // Expiration in milliseconds (1 hour)
);

console.log('Signed URL:', signedUrl);
// URL is valid for the specified expiration time
```

#### Generate CloudFront Signed Cookies for Folder

Generate signed cookies that allow access to all files in a folder:

```typescript
import { s3Service } from '@appinventiv/aws-s3';

// Initialize with CloudFront config
s3Service.initialiseS3Manager({
  cloudfrontDomain: 'https://d1234567890.cloudfront.net',
  cloudfrontKeyPairId: 'APKAIOSFODNN7EXAMPLE'
});

// Load private key
await s3Service.loadConfigForReadablePresignedUrl(
  '/path/to/private-key.pem',
  false
);

// Generate signed cookies for folder access
const cookies = await s3Service.getPreSignedUrlToReadFolder(
  '/uploads/images/',  // Folder path (relative to CloudFront domain)
  3600000              // Expiration in milliseconds (1 hour)
);

console.log('Signed cookies:', cookies);
// Set these cookies in the browser to access all files in the folder
```

### Complete Example

```typescript
import { s3Service } from '@appinventiv/aws-s3';

async function setupS3Service() {
  // Set AWS region
  process.env.AWS_REGION = 'us-east-1';

  // Initialize S3 service with CloudFront config
  s3Service.initialiseS3Manager({
    cloudfrontDomain: 'https://d1234567890.cloudfront.net',
    cloudfrontKeyPairId: 'APKAIOSFODNN7EXAMPLE'
  });

  // Load CloudFront private key
  await s3Service.loadConfigForReadablePresignedUrl(
    './keys/cloudfront-private-key.pem',
    false
  );

  // Generate presigned URL for upload
  const uploadUrl = await s3Service.getPreSignedUrl(
    'my-bucket',
    'uploads',
    'document.pdf',
    3600
  );
  console.log('Upload URL:', uploadUrl);

  // Read file from S3
  const content = await s3Service.readFile(
    'uploads/document.pdf',
    'my-bucket'
  );
  console.log('File content:', content);

  // Get file as Base64
  const base64 = await s3Service.getFileBase64Data({
    bucket: 'my-bucket',
    path: 'uploads/document.pdf'
  });
  console.log('Base64:', base64);

  // Generate CloudFront signed URL
  const signedUrl = await s3Service.getPreSignedUrlToReadFile(
    '/uploads/document.pdf',
    3600000
  );
  console.log('Signed URL:', signedUrl);
}

setupS3Service().catch(console.error);
```

### Express.js Integration Example

```typescript
import express from 'express';
import { s3Service } from '@appinventiv/aws-s3';

const app = express();

// Initialize S3 on startup
s3Service.initialiseS3Manager({
  cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN || '',
  cloudfrontKeyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID || ''
});

// Load CloudFront private key
if (process.env.CLOUDFRONT_PRIVATE_KEY_PATH) {
  await s3Service.loadConfigForReadablePresignedUrl(
    process.env.CLOUDFRONT_PRIVATE_KEY_PATH,
    false
  );
}

// Generate upload URL endpoint
app.post('/api/upload-url', async (req, res) => {
  try {
    const { fileName, folder } = req.body;
    
    const presignedUrl = await s3Service.getPreSignedUrl(
      process.env.S3_BUCKET || 'my-bucket',
      folder || 'uploads',
      fileName,
      3600
    );
    
    res.json({ uploadUrl: presignedUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Get file endpoint
app.get('/api/file/:key', async (req, res) => {
  try {
    const content = await s3Service.readFile(
      req.params.key,
      process.env.S3_BUCKET || 'my-bucket'
    );
    
    res.send(content);
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Generate signed URL endpoint
app.post('/api/signed-url', async (req, res) => {
  try {
    const { filePath, expiration } = req.body;
    
    const signedUrl = await s3Service.getPreSignedUrlToReadFile(
      filePath,
      expiration || 3600000
    );
    
    res.json({ signedUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
```

## API Reference

### `s3Service` (Singleton Instance)

Pre-configured S3 service instance ready to use.

### `AWSS3Provider` Class

Main S3 provider class.

#### `initialiseS3Manager(config?: IS3Config)`

Initializes the S3 service with optional CloudFront configuration.

**Parameters:**
- `config.cloudfrontDomain` (string, optional): CloudFront distribution domain
- `config.cloudfrontKeyPairId` (string, optional): CloudFront key pair ID

**Example:**
```typescript
s3Service.initialiseS3Manager({
  cloudfrontDomain: 'https://d1234567890.cloudfront.net',
  cloudfrontKeyPairId: 'APKAIOSFODNN7EXAMPLE'
});
```

#### `loadConfigForReadablePresignedUrl(privateKeyPath: string, isStoredOnS3: boolean, bucket?: string)`

Loads CloudFront private key from local filesystem or S3.

**Parameters:**
- `privateKeyPath` (string): Path to private key (local path or S3 key)
- `isStoredOnS3` (boolean): Whether key is stored in S3
- `bucket` (string, optional): S3 bucket name (required if `isStoredOnS3` is true)

**Example:**
```typescript
// From local filesystem
await s3Service.loadConfigForReadablePresignedUrl('/path/to/key.pem', false);

// From S3
await s3Service.loadConfigForReadablePresignedUrl('keys/key.pem', true, 'my-bucket');
```

#### `getPreSignedUrl(bucketName: string, basePath: string, fileName: string, expiresIn?: number)`

Generates a presigned URL for uploading files to S3.

**Parameters:**
- `bucketName` (string): S3 bucket name
- `basePath` (string): Base path/folder in bucket
- `fileName` (string): Name of the file
- `expiresIn` (number, optional): Expiration time in seconds (default: 120)

**Returns:**
- `Promise<string>`: Presigned URL for upload

**Example:**
```typescript
const url = await s3Service.getPreSignedUrl('my-bucket', 'uploads', 'file.jpg', 3600);
```

#### `readFile(key: string, bucket: string, encoding?: string)`

Reads a file from S3 bucket.

**Parameters:**
- `key` (string): S3 object key (file path)
- `bucket` (string): S3 bucket name
- `encoding` (string, optional): File encoding (default: UTF-8)

**Returns:**
- `Promise<string>`: File content as string

**Example:**
```typescript
const content = await s3Service.readFile('uploads/file.txt', 'my-bucket', 'utf-8');
```

#### `deleteFile(bucket: string, key: string)`

Deletes a file from S3 bucket.

**Parameters:**
- `bucket` (string): S3 bucket name
- `key` (string): S3 object key (file path)

**Returns:**
- `Promise<object>`: Delete operation result

**Example:**
```typescript
await s3Service.deleteFile('my-bucket', 'uploads/file.jpg');
```

#### `getFileBase64Data(fileData: { bucket: string; path: string })`

Gets file content as Base64 encoded string.

**Parameters:**
- `fileData.bucket` (string): S3 bucket name
- `fileData.path` (string): S3 object key (file path)

**Returns:**
- `Promise<string>`: Base64 encoded file content

**Example:**
```typescript
const base64 = await s3Service.getFileBase64Data({
  bucket: 'my-bucket',
  path: 'uploads/image.jpg'
});
```

#### `getPreSignedUrlToReadFile(filePath: string, expiration: number)`

Generates a CloudFront signed URL for reading a file.

**Parameters:**
- `filePath` (string): File path relative to CloudFront domain
- `expiration` (number): Expiration time in milliseconds

**Returns:**
- `Promise<string>`: CloudFront signed URL

**Example:**
```typescript
const signedUrl = await s3Service.getPreSignedUrlToReadFile('/uploads/file.jpg', 3600000);
```

#### `getPreSignedUrlToReadFolder(folderPath: string, expiration: number)`

Generates CloudFront signed cookies for folder access.

**Parameters:**
- `folderPath` (string): Folder path relative to CloudFront domain
- `expiration` (number): Expiration time in milliseconds

**Returns:**
- `Promise<object>`: CloudFront signed cookies object

**Example:**
```typescript
const cookies = await s3Service.getPreSignedUrlToReadFolder('/uploads/images/', 3600000);
```

## Environment Variables

- `AWS_REGION` (required): AWS region where your S3 bucket is located (e.g., `us-east-1`)

## CloudFront Setup

To use CloudFront signed URLs:

1. Create a CloudFront distribution pointing to your S3 bucket
2. Create a CloudFront key pair in AWS
3. Download the private key
4. Configure the package with CloudFront domain and key pair ID
5. Load the private key using `loadConfigForReadablePresignedUrl()`

## Error Handling

The package includes structured error handling with `S3Exception` class. All errors are automatically categorized and returned in a consistent format:

```typescript
import { s3Service, S3Exception } from '@appinventiv/aws-s3';

try {
    await s3Service.readFile('file.jpg', 'my-bucket');
} catch (error) {
    if (error instanceof S3Exception) {
        const errorResponse = error.getError();
        // Returns: { status: 404, data: { message, type, originalError, context, ... } }
    }
}
```

Error types include: Connection, Authentication, Not Found, Validation, Timeout, Server, and Operation errors.

## TypeScript Support

The package includes full TypeScript definitions and is written in TypeScript.

## Dependencies

- `@aws-sdk/client-s3`: ^3.975.0
- `@aws-sdk/cloudfront-signer`: ^3.975.0
- `@aws-sdk/s3-request-presigner`: ^3.975.0

## Security Best Practices

1. **Never commit AWS credentials** to version control
2. **Use IAM roles** when running on AWS infrastructure (EC2, ECS, Lambda)
3. **Set appropriate expiration times** for presigned URLs
4. **Use CloudFront signed URLs** for secure file access
5. **Store private keys securely** (use AWS Secrets Manager or environment variables)
6. **Use least privilege IAM policies** for S3 access
7. **Enable S3 bucket encryption** for sensitive files

## Troubleshooting

### Common Issues

1. **"Unable to Connect Error"**
   - Verify AWS credentials are configured
   - Check `AWS_REGION` environment variable is set
   - Ensure IAM permissions are correct

2. **"File not found" errors**
   - Verify bucket name is correct
   - Check S3 object key (path) is correct
   - Ensure file exists in the bucket

3. **CloudFront signed URL errors**
   - Verify CloudFront domain and key pair ID are correct
   - Ensure private key is loaded before generating signed URLs
   - Check private key format is correct (PEM format)

4. **Presigned URL expiration**
   - URLs expire after the specified time
   - Generate new URLs if expired
   - Consider longer expiration times for production use

## License

ISC
