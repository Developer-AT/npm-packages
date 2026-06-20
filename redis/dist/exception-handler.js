"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisException = exports.ExceptionHandler = exports.ExceptionMessage = exports.HTTP_STATUS_MESSAGE = void 0;
/**
 * @description HTTP status messages enum
 */
var HTTP_STATUS_MESSAGE;
(function (HTTP_STATUS_MESSAGE) {
    HTTP_STATUS_MESSAGE[HTTP_STATUS_MESSAGE["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HTTP_STATUS_MESSAGE[HTTP_STATUS_MESSAGE["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HTTP_STATUS_MESSAGE[HTTP_STATUS_MESSAGE["FORBIDDEN"] = 403] = "FORBIDDEN";
    HTTP_STATUS_MESSAGE[HTTP_STATUS_MESSAGE["NOT_FOUND"] = 404] = "NOT_FOUND";
    HTTP_STATUS_MESSAGE[HTTP_STATUS_MESSAGE["CONFLICT"] = 409] = "CONFLICT";
    HTTP_STATUS_MESSAGE[HTTP_STATUS_MESSAGE["REQUEST_TIMEOUT"] = 408] = "REQUEST_TIMEOUT";
    HTTP_STATUS_MESSAGE[HTTP_STATUS_MESSAGE["TOO_MANY_REQUESTS"] = 429] = "TOO_MANY_REQUESTS";
    HTTP_STATUS_MESSAGE[HTTP_STATUS_MESSAGE["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    HTTP_STATUS_MESSAGE[HTTP_STATUS_MESSAGE["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
})(HTTP_STATUS_MESSAGE || (exports.HTTP_STATUS_MESSAGE = HTTP_STATUS_MESSAGE = {}));
/**
 * @description Exception message types for Redis operations
 */
var ExceptionMessage;
(function (ExceptionMessage) {
    ExceptionMessage["REDIS_CONNECTION_ERROR"] = "REDIS_CONNECTION_ERROR";
    ExceptionMessage["REDIS_OPERATION_ERROR"] = "REDIS_OPERATION_ERROR";
    ExceptionMessage["REDIS_SERVER_ERROR"] = "REDIS_SERVER_ERROR";
    ExceptionMessage["REDIS_UNKNOWN_ERROR"] = "REDIS_UNKNOWN_ERROR";
})(ExceptionMessage || (exports.ExceptionMessage = ExceptionMessage = {}));
/**
 * @description Base exception handler class for Redis
 */
class ExceptionHandler {
    code;
    status;
    data;
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
exports.ExceptionHandler = ExceptionHandler;
/**
 * @description Redis exception handler
 * Categorizes and handles Redis (ioredis) errors
 */
class RedisException extends ExceptionHandler {
    constructor(error, context) {
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
    categorizeRedisError(error, context) {
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
        if (connectionMatches.some((m) => message.includes(m) || name.includes(m) || code.includes(m))) {
            return {
                type: ExceptionMessage.REDIS_CONNECTION_ERROR,
                message: error?.message ||
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
                message: error?.message ||
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
                message: error?.message ||
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
            message: error?.message ||
                `Redis error while performing '${context?.operation || 'operation'}'`,
            name: error?.name || 'RedisUnknownError',
            status: HTTP_STATUS_MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
}
exports.RedisException = RedisException;
//# sourceMappingURL=exception-handler.js.map