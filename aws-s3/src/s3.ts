import { DeleteObjectCommandInput, GetObjectCommand, GetObjectCommandInput, PutObjectCommand, S3, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CloudfrontSignInput, getSignedUrl as CloudFrontSigner, getSignedCookies } from '@aws-sdk/cloudfront-signer';
import { IS3Config } from './interface';
import { readFileSync } from 'node:fs';
import { S3Exception } from './exception-handler';

/**
 * @description AWS S3 provider class for managing S3 operations
 * Provides functionality for uploading, reading, deleting files, and generating presigned URLs
 * Supports both S3 presigned URLs and CloudFront signed URLs/cookies
 */
class AWSS3Provider {
    private client: S3;
    private privateKey: string | Buffer;
    private cloudfrontDomain: string;
    private cloudfrontKeyPairId: string;

    /**
     * @description Initialize S3 Manager with optional CloudFront configuration
     * @param {IS3Config} config - Optional configuration for CloudFront domain and key pair ID
     */
    public initialiseS3Manager(config?: IS3Config) {
        try {
            this.cloudfrontDomain = config?.cloudfrontDomain ?? '';
            this.cloudfrontKeyPairId = config?.cloudfrontKeyPairId ?? '';
            this.client = new S3(this.getConfiguration());
            console.info('Connected to S3 Manager');
        } catch (error: unknown) {
            console.error(`Error--initializeS3Manager-Unable to Connect--msg :: `, error);
            throw new S3Exception(error, { operation: 'initialiseS3Manager' }).getError();
        }
    }

    /**
     * @description Get S3 client configuration from environment variables
     * @returns {S3ClientConfig} S3 client configuration object
     */
    private getConfiguration(): S3ClientConfig {
        const creds: S3ClientConfig = {};
        creds.region = <string>process.env.AWS_REGION;
        return creds;
    }

    /**
     * @description Load private key for CloudFront signed URL generation
     * @param {string} privateKeyPath - Path to the private key file (local path or S3 key)
     * @param {boolean} isStoredOnS3 - Whether the private key is stored in S3 or locally
     * @param {string} bucket - S3 bucket name (required if isStoredOnS3 is true)
     */
    public async loadConfigForReadablePresignedUrl(privateKeyPath: string, isStoredOnS3: boolean, bucket?: string ){
        try {
            if(isStoredOnS3 && bucket){
                this.privateKey = <string>await this.readFile(privateKeyPath, bucket);
            } else {
                this.privateKey = readFileSync(privateKeyPath, 'utf8');
            }
            console.info('Private key Loaded Successfully');
        } catch (error: unknown) {
            console.error(`Error--loadConfigForReadablePresignedUrl--msg :: `, error);
            throw new S3Exception(error, { 
                operation: 'loadConfigForReadablePresignedUrl',
                bucket 
            }).getError();
        }
    }

    /**
     * @description Generate a presigned URL for uploading files to S3
     * @param {string} bucketName - Name of the S3 bucket
     * @param {string} basePath - Base path/folder in the bucket
     * @param {string} fileName - Name of the file to upload
     * @param {number} expiresIn - Expiration time in seconds (default: 120 seconds / 2 minutes)
     * @returns {Promise<string>} Presigned URL for uploading the file
     */
    public async getPreSignedUrl(
        bucketName: string,
        basePath: string,
        fileName: string,
        expiresIn: number = 120 // Default expiry set to 2 minutes
    ): Promise<string> {
        try {
            console.info(`Generating presigned URL for - ${basePath}/${fileName} in ${bucketName}`);
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: `${basePath}/${fileName}`,
                ACL: 'private'
            });
            return await getSignedUrl(this.client, command, { expiresIn });
        } catch (error: unknown) {
            console.error(`Error--getPreSignedUrl--msg :: `, error);
            throw new S3Exception(error, {
                operation: 'getPreSignedUrl',
                bucket: bucketName,
                key: `${basePath}/${fileName}`
            }).getError();
        }
    }

    /**
     * @description Generate a CloudFront signed URL for reading a file
     * @param {string} filePath - Path to the file in CloudFront (relative to domain)
     * @param {number} expiration - Expiration time in milliseconds
     * @returns {Promise<string>} CloudFront signed URL for reading the file
     */
    public async getPreSignedUrlToReadFile(filePath: string, expiration: number) {
        try {
            const cmd: CloudfrontSignInput = {
                url: `${this.cloudfrontDomain}${filePath}`,
                keyPairId: this.cloudfrontKeyPairId,
                dateLessThan: new Date(Date.now() + expiration).toISOString(),
                privateKey: this.privateKey
            }

            return CloudFrontSigner(cmd);
        } catch (error: unknown) {
            console.error(`Error--getPreSignedUrlToReadFile--msg :: `, error);
            throw new S3Exception(error, {
                operation: 'getPreSignedUrlToReadFile',
                key: filePath
            }).getError();
        }
    }

    /**
     * @description Generate CloudFront signed cookies for reading files in a folder
     * @param {string} folderPath - Path to the folder in CloudFront (relative to domain)
     * @param {number} expiration - Expiration time in milliseconds
     * @returns {Promise<object>} CloudFront signed cookies object
     */
    public async getPreSignedUrlToReadFolder(folderPath: string, expiration: number) {
        try {
            const policy = {
                Statement: [
                    {
                        Resource: `${this.cloudfrontDomain}${folderPath}*`,
                        Condition: {
                            DateLessThan: {
                                'AWS:EpochTime': Math.floor((Date.now() + expiration) / 1000) //new Date(Date.now() + expiration).valueOf()
                            }
                        }
                    }
                ]
            };
            const cmd: CloudfrontSignInput = {
                keyPairId: this.cloudfrontKeyPairId,
                privateKey: this.privateKey,
                policy: JSON.stringify(policy)
            };

            return getSignedCookies(cmd);
        } catch (error: unknown) {
            console.error(`Error--getPreSignedUrlToReadFolder--msg :: `, error);
            throw new S3Exception(error, {
                operation: 'getPreSignedUrlToReadFolder',
                key: folderPath
            }).getError();
        }
    }

    /**
     * @description Read a file from S3 bucket
     * @param {string} key - S3 object key (file path)
     * @param {string} bucket - S3 bucket name
     * @param {string} encoding - Optional encoding for the file content (default: UTF-8)
     * @returns {Promise<string>} File content as string
     */
    async readFile(key: string, bucket: string, encoding?: string) {
        try {
            const params: GetObjectCommandInput = {
                Bucket: bucket,
                Key: key
            };
            const file = await this.client.getObject(params);
            return await file.Body?.transformToString(encoding);
        } catch (error: unknown) {
            console.error(`Error--readFile--msg :: `, error);
            throw new S3Exception(error, {
                operation: 'readFile',
                bucket,
                key
            }).getError();
        }
    }

    /**
     * @description Delete a file from S3 bucket
     * @param {string} bucket - S3 bucket name
     * @param {string} key - S3 object key (file path)
     * @returns {Promise<object>} Delete operation result
     */
    async deleteFile(bucket: string,key: string) {
        try {
            const params: DeleteObjectCommandInput = {
                Bucket: bucket,
                Key: key
            };
            return await this.client.deleteObject(params);
        } catch (error: unknown) {
            console.error(`Error--deleteFile--msg :: `, error);
            throw new S3Exception(error, {
                operation: 'deleteFile',
                bucket,
                key
            }).getError();
        }
    }

    /**
     * @description Get file content as Base64 encoded string from S3
     * @param {object} fileData - File data object
     * @param {string} fileData.bucket - S3 bucket name
     * @param {string} fileData.path - S3 object key (file path)
     * @returns {Promise<string>} Base64 encoded file content
     * @throws {Error} If file body is empty or unreadable
     */
    async getFileBase64Data(fileData: { bucket: string; path: string }) {
        try {
            const params: GetObjectCommandInput = {
                Bucket: fileData.bucket,
                Key: fileData.path
            };
            const file = await this.client.send(new GetObjectCommand(params));

            const bytes = await file.Body?.transformToByteArray();

            if (!bytes || bytes.length === 0) {
                throw new S3Exception(
                    { message: `File body is empty or unreadable from S3`, Code: 'EmptyFileBody' },
                    {
                        operation: 'getFileBase64Data',
                        bucket: fileData.bucket,
                        key: fileData.path
                    }
                ).getError();
            }

            // Convert to Base64 string
            return Buffer.from(bytes).toString('base64');
        } catch (error: unknown) {
            console.error(`Error--getFileBase64Data--msg :: `, error);
            throw new S3Exception(error, {
                operation: 'getFileBase64Data',
                bucket: fileData.bucket,
                key: fileData.path
            }).getError();
        }
    }
}

export const s3Service = new AWSS3Provider();
