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
 * @description Exception message types for Redis operations
 */
export declare enum ExceptionMessage {
    REDIS_CONNECTION_ERROR = "REDIS_CONNECTION_ERROR",
    REDIS_OPERATION_ERROR = "REDIS_OPERATION_ERROR",
    REDIS_SERVER_ERROR = "REDIS_SERVER_ERROR",
    REDIS_UNKNOWN_ERROR = "REDIS_UNKNOWN_ERROR"
}
/**
 * @description Base exception handler class for Redis
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
 * @description Redis exception handler
 * Categorizes and handles Redis (ioredis) errors
 */
export declare class RedisException extends ExceptionHandler {
    constructor(error: any, context?: {
        operation?: string;
        key?: string;
        hashName?: string;
        field?: string;
    });
    /**
     * @description Categorize Redis error based on message/name/code
     * @param error - Redis error object
     * @param context - Additional context (key, hashName, operation)
     */
    private categorizeRedisError;
}
