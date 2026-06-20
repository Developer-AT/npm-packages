/**
 * @description HTTP status messages enum
 */
export declare enum HTTP_STATUS_MESSAGE {
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    REQUEST_TIMEOUT = 408,
    TOO_MANY_REQUESTS = 429,
    INTERNAL_SERVER_ERROR = 500,
    SERVICE_UNAVAILABLE = 503
}
/**
 * @description Exception message types for S3 operations
 */
export declare enum ExceptionMessage {
    S3_CONNECTION_ERROR = "S3_CONNECTION_ERROR",
    S3_OPERATION_ERROR = "S3_OPERATION_ERROR",
    S3_AUTH_ERROR = "S3_AUTH_ERROR",
    S3_NOT_FOUND = "S3_NOT_FOUND",
    S3_SERVER_ERROR = "S3_SERVER_ERROR",
    S3_TIMEOUT_ERROR = "S3_TIMEOUT_ERROR",
    S3_VALIDATION_ERROR = "S3_VALIDATION_ERROR",
    S3_UNKNOWN_ERROR = "S3_UNKNOWN_ERROR"
}
/**
 * @description S3 connection error codes
 */
export declare const S3_CONNECTION_ERROR: {
    ECONNREFUSED: string;
    ENOTFOUND: string;
    ECONNRESET: string;
    EHOSTUNREACH: string;
    EADDRNOTAVAIL: string;
    ETIMEDOUT: string;
    NETWORK_ERROR: string;
    TIMEOUT_ERROR: string;
};
/**
 * @description S3 operation error codes
 */
export declare const S3_OPERATION_ERROR: {
    NO_SUCH_KEY: string;
    NO_SUCH_BUCKET: string;
    ACCESS_DENIED: string;
    INVALID_BUCKET_NAME: string;
    BUCKET_ALREADY_EXISTS: string;
    INVALID_OBJECT_STATE: string;
    KEY_TOO_LONG: string;
    INVALID_ARGUMENT: string;
};
/**
 * @description Base exception handler class
 */
export declare class ExceptionHandler {
    protected code: number;
    protected status: HTTP_STATUS_MESSAGE;
    protected data: any;
    /**
     * @description Get error response object
     * @returns {object} Error object with status and data
     */
    getError(): {
        status: HTTP_STATUS_MESSAGE;
        data: any;
    };
}
/**
 * @description AWS S3 exception handler
 * Categorizes and handles AWS S3 SDK errors
 */
export declare class S3Exception extends ExceptionHandler {
    constructor(error: any, context?: {
        bucket?: string;
        key?: string;
        operation?: string;
    });
    /**
     * @description Categorize S3 error based on error type and code
     * @param {any} error - AWS SDK error object
     * @param {object} context - Additional context (bucket, key, operation)
     * @returns {object} Categorized error information
     */
    private categorizeS3Error;
}
