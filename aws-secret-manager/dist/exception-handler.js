"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretsManagerException = exports.ExceptionHandler = exports.SECRETS_MANAGER_OPERATION_ERROR = exports.SECRETS_MANAGER_CONNECTION_ERROR = exports.ExceptionMessage = exports.HTTP_STATUS_MESSAGE = void 0;
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
 * @description Exception message types for Secrets Manager operations
 */
var ExceptionMessage;
(function (ExceptionMessage) {
    ExceptionMessage["SECRETS_MANAGER_CONNECTION_ERROR"] = "SECRETS_MANAGER_CONNECTION_ERROR";
    ExceptionMessage["SECRETS_MANAGER_OPERATION_ERROR"] = "SECRETS_MANAGER_OPERATION_ERROR";
    ExceptionMessage["SECRETS_MANAGER_AUTH_ERROR"] = "SECRETS_MANAGER_AUTH_ERROR";
    ExceptionMessage["SECRETS_MANAGER_NOT_FOUND"] = "SECRETS_MANAGER_NOT_FOUND";
    ExceptionMessage["SECRETS_MANAGER_SERVER_ERROR"] = "SECRETS_MANAGER_SERVER_ERROR";
    ExceptionMessage["SECRETS_MANAGER_TIMEOUT_ERROR"] = "SECRETS_MANAGER_TIMEOUT_ERROR";
    ExceptionMessage["SECRETS_MANAGER_VALIDATION_ERROR"] = "SECRETS_MANAGER_VALIDATION_ERROR";
    ExceptionMessage["SECRETS_MANAGER_UNKNOWN_ERROR"] = "SECRETS_MANAGER_UNKNOWN_ERROR";
})(ExceptionMessage || (exports.ExceptionMessage = ExceptionMessage = {}));
/**
 * @description Secrets Manager connection error codes
 */
exports.SECRETS_MANAGER_CONNECTION_ERROR = {
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
 * @description Secrets Manager operation error codes
 */
exports.SECRETS_MANAGER_OPERATION_ERROR = {
    RESOURCE_NOT_FOUND: 'ResourceNotFoundException',
    INVALID_PARAMETER: 'InvalidParameterException',
    INVALID_REQUEST: 'InvalidRequestException',
    DECRYPTION_FAILURE: 'DecryptionFailureException',
    INTERNAL_SERVICE_ERROR: 'InternalServiceErrorException',
    INVALID_NEXT_TOKEN: 'InvalidNextTokenException',
    MALFORMED_POLICY_DOCUMENT: 'MalformedPolicyDocumentException',
    PRECONDITION_NOT_MET: 'PreconditionNotMetException',
    PUBLIC_POLICY_EXCEPTION: 'PublicPolicyException',
    RESOURCE_EXISTS: 'ResourceExistsException'
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
 * @description AWS Secrets Manager exception handler
 * Categorizes and handles AWS Secrets Manager SDK errors
 */
class SecretsManagerException extends ExceptionHandler {
    constructor(error, context) {
        super();
        const { type, status, message, name } = this.categorizeSecretsManagerError(error, context);
        this.data = {
            message: message || type,
            type: type,
            originalError: name || 'SecretsManagerError',
            stack: error?.stack,
            requestId: error?.$metadata?.requestId,
            context: context || null
        };
        this.status = status;
    }
    /**
     * @description Categorize Secrets Manager error based on error type and code
     * @param {any} error - AWS SDK error object
     * @param {object} context - Additional context (secretName, operation)
     * @returns {object} Categorized error information
     */
    categorizeSecretsManagerError(error, context) {
        const message = (error?.message || '').toLowerCase();
        const name = (error?.name || '').toLowerCase();
        const code = error?.name || error?.Code || '';
        const httpStatusCode = error?.$metadata?.httpStatusCode || 500;
        // ------------------
        // Connection Errors
        // ------------------
        const connectionMatches = [
            exports.SECRETS_MANAGER_CONNECTION_ERROR.ECONNREFUSED,
            exports.SECRETS_MANAGER_CONNECTION_ERROR.ENOTFOUND,
            exports.SECRETS_MANAGER_CONNECTION_ERROR.ECONNRESET,
            exports.SECRETS_MANAGER_CONNECTION_ERROR.EHOSTUNREACH,
            exports.SECRETS_MANAGER_CONNECTION_ERROR.EADDRNOTAVAIL,
            exports.SECRETS_MANAGER_CONNECTION_ERROR.ETIMEDOUT,
            exports.SECRETS_MANAGER_CONNECTION_ERROR.NETWORK_ERROR,
            exports.SECRETS_MANAGER_CONNECTION_ERROR.TIMEOUT_ERROR,
            'networkerror',
            'timeout',
            'connection'
        ];
        if (connectionMatches.some((m) => message.includes(m.toLowerCase()) || name.includes(m.toLowerCase()))) {
            return {
                type: ExceptionMessage.SECRETS_MANAGER_CONNECTION_ERROR,
                message: `Secrets Manager connection error: ${error?.message || 'Unable to connect to AWS Secrets Manager'}`,
                name: name || 'SecretsManagerConnectionError',
                status: HTTP_STATUS_MESSAGE.SERVICE_UNAVAILABLE
            };
        }
        // ------------------
        // Authentication Errors
        // ------------------
        const authMatches = [
            'InvalidAccessKeyId',
            'SignatureDoesNotMatch',
            'InvalidSecurity',
            'MissingSecurityHeader',
            'TokenRefreshRequired',
            'InvalidToken',
            'ExpiredToken',
            'UnauthorizedOperation',
            'accessdenied',
            'unauthorized',
            'forbidden'
        ];
        if (authMatches.some((m) => code?.toLowerCase().includes(m.toLowerCase()) ||
            message.includes(m.toLowerCase()) ||
            name.includes(m.toLowerCase()))) {
            return {
                type: ExceptionMessage.SECRETS_MANAGER_AUTH_ERROR,
                message: `Secrets Manager authentication error: ${error?.message || 'Access denied. Check your IAM permissions'}`,
                name: name || 'SecretsManagerAuthError',
                status: HTTP_STATUS_MESSAGE.UNAUTHORIZED
            };
        }
        // ------------------
        // Not Found Errors
        // ------------------
        const notFoundMatches = [
            exports.SECRETS_MANAGER_OPERATION_ERROR.RESOURCE_NOT_FOUND,
            'resourcenotfound',
            'notfound',
            'secretnotfound'
        ];
        if (notFoundMatches.some((m) => code?.toLowerCase().includes(m.toLowerCase()) ||
            message.includes(m.toLowerCase()) ||
            name.includes(m.toLowerCase()))) {
            const secretInfo = context?.secretName ? ` for secret '${context.secretName}'` : '';
            return {
                type: ExceptionMessage.SECRETS_MANAGER_NOT_FOUND,
                message: `Secret not found${secretInfo}: ${error?.message || 'Secret does not exist'}`,
                name: name || 'SecretsManagerNotFoundError',
                status: HTTP_STATUS_MESSAGE.NOT_FOUND
            };
        }
        // ------------------
        // Validation Errors
        // ------------------
        const validationMatches = [
            exports.SECRETS_MANAGER_OPERATION_ERROR.INVALID_PARAMETER,
            exports.SECRETS_MANAGER_OPERATION_ERROR.INVALID_REQUEST,
            exports.SECRETS_MANAGER_OPERATION_ERROR.MALFORMED_POLICY_DOCUMENT,
            'InvalidParameter',
            'InvalidRequest',
            'MalformedPolicyDocument',
            'validation',
            'invalid'
        ];
        if (validationMatches.some((m) => code?.toLowerCase().includes(m.toLowerCase()) ||
            message.includes(m.toLowerCase()) ||
            name.includes(m.toLowerCase()))) {
            return {
                type: ExceptionMessage.SECRETS_MANAGER_VALIDATION_ERROR,
                message: `Secrets Manager validation error: ${error?.message || 'Invalid request parameters'}`,
                name: name || 'SecretsManagerValidationError',
                status: HTTP_STATUS_MESSAGE.BAD_REQUEST
            };
        }
        // ------------------
        // Decryption Errors
        // ------------------
        if (code?.toLowerCase().includes('decryption') ||
            message.includes('decryption') ||
            name.includes('decryption')) {
            return {
                type: ExceptionMessage.SECRETS_MANAGER_OPERATION_ERROR,
                message: `Secrets Manager decryption error: ${error?.message || 'Failed to decrypt secret'}`,
                name: name || 'SecretsManagerDecryptionError',
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
                type: ExceptionMessage.SECRETS_MANAGER_TIMEOUT_ERROR,
                message: `Secrets Manager request timeout: ${error?.message || 'Request took too long'}`,
                name: name || 'SecretsManagerTimeoutError',
                status: HTTP_STATUS_MESSAGE.REQUEST_TIMEOUT
            };
        }
        // ------------------
        // Server Errors (5xx)
        // ------------------
        if (httpStatusCode >= 500 && httpStatusCode < 600) {
            return {
                type: ExceptionMessage.SECRETS_MANAGER_SERVER_ERROR,
                message: `Secrets Manager server error: ${error?.message || 'Internal server error'}`,
                name: name || 'SecretsManagerServerError',
                status: HTTP_STATUS_MESSAGE.INTERNAL_SERVER_ERROR
            };
        }
        // ------------------
        // Operational Errors (4xx)
        // ------------------
        if (httpStatusCode >= 400 && httpStatusCode < 500) {
            return {
                type: ExceptionMessage.SECRETS_MANAGER_OPERATION_ERROR,
                message: `Secrets Manager operation error: ${error?.message || 'Operation failed'}`,
                name: name || 'SecretsManagerOperationError',
                status: httpStatusCode || HTTP_STATUS_MESSAGE.BAD_REQUEST
            };
        }
        // ------------------
        // Default / Unknown
        // ------------------
        return {
            type: ExceptionMessage.SECRETS_MANAGER_UNKNOWN_ERROR,
            message: `Secrets Manager error: ${error?.message || 'Unknown error occurred'}`,
            name: name || 'SecretsManagerUnknownError',
            status: HTTP_STATUS_MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
}
exports.SecretsManagerException = SecretsManagerException;
//# sourceMappingURL=exception-handler.js.map