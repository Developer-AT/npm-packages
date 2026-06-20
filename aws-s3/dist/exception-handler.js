"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Exception = exports.ExceptionHandler = exports.S3_OPERATION_ERROR = exports.S3_CONNECTION_ERROR = exports.ExceptionMessage = exports.HTTP_STATUS_MESSAGE = void 0;
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
 * @description Exception message types for S3 operations
 */
var ExceptionMessage;
(function (ExceptionMessage) {
    ExceptionMessage["S3_CONNECTION_ERROR"] = "S3_CONNECTION_ERROR";
    ExceptionMessage["S3_OPERATION_ERROR"] = "S3_OPERATION_ERROR";
    ExceptionMessage["S3_AUTH_ERROR"] = "S3_AUTH_ERROR";
    ExceptionMessage["S3_NOT_FOUND"] = "S3_NOT_FOUND";
    ExceptionMessage["S3_SERVER_ERROR"] = "S3_SERVER_ERROR";
    ExceptionMessage["S3_TIMEOUT_ERROR"] = "S3_TIMEOUT_ERROR";
    ExceptionMessage["S3_VALIDATION_ERROR"] = "S3_VALIDATION_ERROR";
    ExceptionMessage["S3_UNKNOWN_ERROR"] = "S3_UNKNOWN_ERROR";
})(ExceptionMessage || (exports.ExceptionMessage = ExceptionMessage = {}));
/**
 * @description S3 connection error codes
 */
exports.S3_CONNECTION_ERROR = {
    ECONNREFUSED: 'ECONNREFUSED',
    ENOTFOUND: 'ENOTFOUND',
    ECONNRESET: 'ECONNRESET',
    EHOSTUNREACH: 'EHOSTUNREACH',
    EADDRNOTAVAIL: 'EADDRNOTAVAIL',
    ETIMEDOUT: 'ETIMEDOUT',
    NETWORK_ERROR: 'NetworkError',
    TIMEOUT_ERROR: 'TimeoutError'
};
/**
 * @description S3 operation error codes
 */
exports.S3_OPERATION_ERROR = {
    NO_SUCH_KEY: 'NoSuchKey',
    NO_SUCH_BUCKET: 'NoSuchBucket',
    ACCESS_DENIED: 'AccessDenied',
    INVALID_BUCKET_NAME: 'InvalidBucketName',
    BUCKET_ALREADY_EXISTS: 'BucketAlreadyExists',
    INVALID_OBJECT_STATE: 'InvalidObjectState',
    KEY_TOO_LONG: 'KeyTooLongError',
    INVALID_ARGUMENT: 'InvalidArgument'
};
/**
 * @description Base exception handler class
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
 * @description AWS S3 exception handler
 * Categorizes and handles AWS S3 SDK errors
 */
class S3Exception extends ExceptionHandler {
    constructor(error, context) {
        super();
        const { type, status, message, name } = this.categorizeS3Error(error, context);
        this.data = {
            message: message || type,
            type: type,
            originalError: name || 'S3Error',
            stack: error?.stack,
            requestId: error?.$metadata?.requestId,
            context: context || null
        };
        this.status = status;
    }
    /**
     * @description Categorize S3 error based on error type and code
     * @param {any} error - AWS SDK error object
     * @param {object} context - Additional context (bucket, key, operation)
     * @returns {object} Categorized error information
     */
    categorizeS3Error(error, context) {
        const message = (error?.message || '').toLowerCase();
        const name = (error?.name || '').toLowerCase();
        const code = error?.Code || error?.code || '';
        const httpStatusCode = error?.$metadata?.httpStatusCode || 500;
        // ------------------
        // Connection Errors
        // ------------------
        const connectionMatches = [
            exports.S3_CONNECTION_ERROR.ECONNREFUSED,
            exports.S3_CONNECTION_ERROR.ENOTFOUND,
            exports.S3_CONNECTION_ERROR.ECONNRESET,
            exports.S3_CONNECTION_ERROR.EHOSTUNREACH,
            exports.S3_CONNECTION_ERROR.EADDRNOTAVAIL,
            exports.S3_CONNECTION_ERROR.ETIMEDOUT,
            exports.S3_CONNECTION_ERROR.NETWORK_ERROR,
            exports.S3_CONNECTION_ERROR.TIMEOUT_ERROR,
            'networkerror',
            'timeout',
            'connection'
        ];
        if (connectionMatches.some((m) => message.includes(m.toLowerCase()) || name.includes(m.toLowerCase()))) {
            return {
                type: ExceptionMessage.S3_CONNECTION_ERROR,
                message: `S3 connection error: ${error?.message || 'Unable to connect to S3'}`,
                name: name || 'S3ConnectionError',
                status: HTTP_STATUS_MESSAGE.SERVICE_UNAVAILABLE
            };
        }
        // ------------------
        // Authentication Errors
        // ------------------
        const authMatches = [
            exports.S3_OPERATION_ERROR.ACCESS_DENIED,
            'InvalidAccessKeyId',
            'SignatureDoesNotMatch',
            'InvalidSecurity',
            'MissingSecurityHeader',
            'TokenRefreshRequired',
            'InvalidToken',
            'ExpiredToken',
            'accessdenied',
            'unauthorized',
            'forbidden'
        ];
        if (authMatches.some((m) => code?.toLowerCase().includes(m.toLowerCase()) ||
            message.includes(m.toLowerCase()) ||
            name.includes(m.toLowerCase()))) {
            return {
                type: ExceptionMessage.S3_AUTH_ERROR,
                message: `S3 authentication error: ${error?.message || 'Access denied. Check your IAM permissions'}`,
                name: name || 'S3AuthError',
                status: HTTP_STATUS_MESSAGE.UNAUTHORIZED
            };
        }
        // ------------------
        // Not Found Errors
        // ------------------
        const notFoundMatches = [
            exports.S3_OPERATION_ERROR.NO_SUCH_KEY,
            exports.S3_OPERATION_ERROR.NO_SUCH_BUCKET,
            'nosuchkey',
            'nosuchbucket',
            'notfound'
        ];
        if (notFoundMatches.some((m) => code?.toLowerCase().includes(m.toLowerCase()) ||
            message.includes(m.toLowerCase()) ||
            name.includes(m.toLowerCase()))) {
            const bucketInfo = context?.bucket ? ` in bucket '${context.bucket}'` : '';
            const keyInfo = context?.key ? ` for key '${context.key}'` : '';
            return {
                type: ExceptionMessage.S3_NOT_FOUND,
                message: `S3 resource not found${keyInfo}${bucketInfo}: ${error?.message || 'Resource does not exist'}`,
                name: name || 'S3NotFoundError',
                status: HTTP_STATUS_MESSAGE.NOT_FOUND
            };
        }
        // ------------------
        // Validation Errors
        // ------------------
        const validationMatches = [
            exports.S3_OPERATION_ERROR.INVALID_BUCKET_NAME,
            exports.S3_OPERATION_ERROR.KEY_TOO_LONG,
            exports.S3_OPERATION_ERROR.INVALID_ARGUMENT,
            'InvalidArgument',
            'MalformedXML',
            'KeyTooLongError',
            'validation',
            'invalid'
        ];
        if (validationMatches.some((m) => code?.toLowerCase().includes(m.toLowerCase()) ||
            message.includes(m.toLowerCase()) ||
            name.includes(m.toLowerCase()))) {
            return {
                type: ExceptionMessage.S3_VALIDATION_ERROR,
                message: `S3 validation error: ${error?.message || 'Invalid request parameters'}`,
                name: name || 'S3ValidationError',
                status: HTTP_STATUS_MESSAGE.BAD_REQUEST
            };
        }
        // ------------------
        // Timeout Errors
        // ------------------
        if (code === 'RequestTimeout' ||
            message.includes('timeout') ||
            name.includes('timeout') ||
            httpStatusCode === 408) {
            return {
                type: ExceptionMessage.S3_TIMEOUT_ERROR,
                message: `S3 request timeout: ${error?.message || 'Request took too long'}`,
                name: name || 'S3TimeoutError',
                status: HTTP_STATUS_MESSAGE.REQUEST_TIMEOUT
            };
        }
        // ------------------
        // Server Errors (5xx)
        // ------------------
        if (httpStatusCode >= 500 && httpStatusCode < 600) {
            return {
                type: ExceptionMessage.S3_SERVER_ERROR,
                message: `S3 server error: ${error?.message || 'Internal server error'}`,
                name: name || 'S3ServerError',
                status: HTTP_STATUS_MESSAGE.INTERNAL_SERVER_ERROR
            };
        }
        // ------------------
        // Operational Errors (4xx)
        // ------------------
        if (httpStatusCode >= 400 && httpStatusCode < 500) {
            return {
                type: ExceptionMessage.S3_OPERATION_ERROR,
                message: `S3 operation error: ${error?.message || 'Operation failed'}`,
                name: name || 'S3OperationError',
                status: httpStatusCode || HTTP_STATUS_MESSAGE.BAD_REQUEST
            };
        }
        // ------------------
        // Default / Unknown
        // ------------------
        return {
            type: ExceptionMessage.S3_UNKNOWN_ERROR,
            message: `S3 error: ${error?.message || 'Unknown error occurred'}`,
            name: name || 'S3UnknownError',
            status: HTTP_STATUS_MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
}
exports.S3Exception = S3Exception;
//# sourceMappingURL=exception-handler.js.map