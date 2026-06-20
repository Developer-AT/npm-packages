/**
 * @description HTTP status messages enum
 */
export enum HTTP_STATUS_MESSAGE {
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
export enum ExceptionMessage {
    REDIS_CONNECTION_ERROR = 'REDIS_CONNECTION_ERROR',
    REDIS_OPERATION_ERROR = 'REDIS_OPERATION_ERROR',
    REDIS_SERVER_ERROR = 'REDIS_SERVER_ERROR',
    REDIS_UNKNOWN_ERROR = 'REDIS_UNKNOWN_ERROR'
}

/**
 * @description Base exception handler class for Redis
 */
export class ExceptionHandler {
    protected code: number;
    protected status: HTTP_STATUS_MESSAGE;
    protected data: any;

    /**
     * @description Get error response object
     * @returns {object} Error object with status and data
     */
    getError() {
        return {
            status: this.status || HTTP_STATUS_MESSAGE.BAD_REQUEST,
            data: this.data
        };
    }
}

/**
 * @description Redis exception handler
 * Categorizes and handles Redis (ioredis) errors
 */
export class RedisException extends ExceptionHandler {
    constructor(error: any, context?: { operation?: string; key?: string; hashName?: string; field?: string }) {
        super();

        const { type, status, message, name } = this.categorizeRedisError(error, context);

        this.data = {
            message: message || type,
            type: type,
            originalError: name || 'RedisError',
            stack: error?.stack,
            context: context || null
        };
        this.status = status;
    }

    /**
     * @description Categorize Redis error based on message/name/code
     * @param error - Redis error object
     * @param context - Additional context (key, hashName, operation)
     */
    private categorizeRedisError(
        error: any,
        context?: { operation?: string; key?: string; hashName?: string; field?: string }
    ): {
        type: ExceptionMessage;
        message: string;
        name: string;
        status: HTTP_STATUS_MESSAGE;
    } {
        const message = (error?.message || '').toLowerCase();
        const name = (error?.name || '').toLowerCase();
        const code = (error?.code || '').toLowerCase();

        // ------------------
        // Connection Errors
        // ------------------
        const connectionMatches = [
            'econnrefused',
            'enotfound',
            'econnreset',
            'ehostunreach',
            'eaddrnotavail',
            'etimedout',
            'timeout',
            'connection',
            'networkerror',
            'redisconnectionerror',
            'redistimeouterror'
        ];

        if (
            connectionMatches.some(
                (m) => message.includes(m) || name.includes(m) || code.includes(m)
            )
        ) {
            return {
                type: ExceptionMessage.REDIS_CONNECTION_ERROR,
                message:
                    error?.message ||
                    `Redis connection error while performing '${context?.operation || 'operation'}'`,
                name: error?.name || 'RedisConnectionError',
                status: HTTP_STATUS_MESSAGE.SERVICE_UNAVAILABLE
            };
        }

        // ------------------
        // Operational / Command Errors
        // ------------------
        const operationalMatches = [
            'rediscommanderror',
            'wrongtype',
            'syntax error',
            'readonly',
            'busy',
            'noscript',
            'moved',
            'ask',
            'tryagain'
        ];

        if (operationalMatches.some((m) => message.includes(m) || name.includes(m))) {
            return {
                type: ExceptionMessage.REDIS_OPERATION_ERROR,
                message:
                    error?.message ||
                    `Redis operation error while performing '${context?.operation || 'operation'}'`,
                name: error?.name || 'RedisOperationError',
                status: HTTP_STATUS_MESSAGE.BAD_REQUEST
            };
        }

        // ------------------
        // Server Errors (generic)
        // ------------------
        if (message.includes('internal') || name.includes('internal')) {
            return {
                type: ExceptionMessage.REDIS_SERVER_ERROR,
                message:
                    error?.message ||
                    `Redis server error while performing '${context?.operation || 'operation'}'`,
                name: error?.name || 'RedisServerError',
                status: HTTP_STATUS_MESSAGE.INTERNAL_SERVER_ERROR
            };
        }

        // ------------------
        // Default / Unknown
        // ------------------
        return {
            type: ExceptionMessage.REDIS_UNKNOWN_ERROR,
            message:
                error?.message ||
                `Redis error while performing '${context?.operation || 'operation'}'`,
            name: error?.name || 'RedisUnknownError',
            status: HTTP_STATUS_MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
}

