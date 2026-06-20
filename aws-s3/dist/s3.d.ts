import { IS3Config } from './interface';
/**
 * @description AWS S3 provider class for managing S3 operations
 * Provides functionality for uploading, reading, deleting files, and generating presigned URLs
 * Supports both S3 presigned URLs and CloudFront signed URLs/cookies
 */
declare class AWSS3Provider {
    private client;
    private privateKey;
    private cloudfrontDomain;
    private cloudfrontKeyPairId;
    /**
     * @description Initialize S3 Manager with optional CloudFront configuration
     * @param {IS3Config} config - Optional configuration for CloudFront domain and key pair ID
     */
    initialiseS3Manager(config?: IS3Config): void;
    /**
     * @description Get S3 client configuration from environment variables
     * @returns {S3ClientConfig} S3 client configuration object
     */
    private getConfiguration;
    /**
     * @description Load private key for CloudFront signed URL generation
     * @param {string} privateKeyPath - Path to the private key file (local path or S3 key)
     * @param {boolean} isStoredOnS3 - Whether the private key is stored in S3 or locally
     * @param {string} bucket - S3 bucket name (required if isStoredOnS3 is true)
     */
    loadConfigForReadablePresignedUrl(privateKeyPath: string, isStoredOnS3: boolean, bucket?: string): Promise<void>;
    /**
     * @description Generate a presigned URL for uploading files to S3
     * @param {string} bucketName - Name of the S3 bucket
     * @param {string} basePath - Base path/folder in the bucket
     * @param {string} fileName - Name of the file to upload
     * @param {number} expiresIn - Expiration time in seconds (default: 120 seconds / 2 minutes)
     * @returns {Promise<string>} Presigned URL for uploading the file
     */
    getPreSignedUrl(bucketName: string, basePath: string, fileName: string, expiresIn?: number): Promise<string>;
    /**
     * @description Generate a CloudFront signed URL for reading a file
     * @param {string} filePath - Path to the file in CloudFront (relative to domain)
     * @param {number} expiration - Expiration time in milliseconds
     * @returns {Promise<string>} CloudFront signed URL for reading the file
     */
    getPreSignedUrlToReadFile(filePath: string, expiration: number): Promise<string>;
    /**
     * @description Generate CloudFront signed cookies for reading files in a folder
     * @param {string} folderPath - Path to the folder in CloudFront (relative to domain)
     * @param {number} expiration - Expiration time in milliseconds
     * @returns {Promise<object>} CloudFront signed cookies object
     */
    getPreSignedUrlToReadFolder(folderPath: string, expiration: number): Promise<import("@aws-sdk/cloudfront-signer").CloudfrontSignedCookiesOutput>;
    /**
     * @description Read a file from S3 bucket
     * @param {string} key - S3 object key (file path)
     * @param {string} bucket - S3 bucket name
     * @param {string} encoding - Optional encoding for the file content (default: UTF-8)
     * @returns {Promise<string>} File content as string
     */
    readFile(key: string, bucket: string, encoding?: string): Promise<string | undefined>;
    /**
     * @description Delete a file from S3 bucket
     * @param {string} bucket - S3 bucket name
     * @param {string} key - S3 object key (file path)
     * @returns {Promise<object>} Delete operation result
     */
    deleteFile(bucket: string, key: string): Promise<import("@aws-sdk/client-s3").DeleteObjectCommandOutput>;
    /**
     * @description Get file content as Base64 encoded string from S3
     * @param {object} fileData - File data object
     * @param {string} fileData.bucket - S3 bucket name
     * @param {string} fileData.path - S3 object key (file path)
     * @returns {Promise<string>} Base64 encoded file content
     * @throws {Error} If file body is empty or unreadable
     */
    getFileBase64Data(fileData: {
        bucket: string;
        path: string;
    }): Promise<string>;
}
export declare const s3Service: AWSS3Provider;
export {};
