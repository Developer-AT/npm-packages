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
 * @description Exception message types for Secrets Manager operations
 */
export enum ExceptionMessage {
    SECRETS_MANAGER_CONNECTION_ERROR = 'SECRETS_MANAGER_CONNECTION_ERROR',
    SECRETS_MANAGER_OPERATION_ERROR = 'SECRETS_MANAGER_OPERATION_ERROR',
    SECRETS_MANAGER_AUTH_ERROR = 'SECRETS_MANAGER_AUTH_ERROR',
    SECRETS_MANAGER_NOT_FOUND = 'SECRETS_MANAGER_NOT_FOUND',
    SECRETS_MANAGER_SERVER_ERROR = 'SECRETS_MANAGER_SERVER_ERROR',
    SECRETS_MANAGER_TIMEOUT_ERROR = 'SECRETS_MANAGER_TIMEOUT_ERROR',
    SECRETS_MANAGER_VALIDATION_ERROR = 'SECRETS_MANAGER_VALIDATION_ERROR',
    SECRETS_MANAGER_UNKNOWN_ERROR = 'SECRETS_MANAGER_UNKNOWN_ERROR'
}

/**
 * @description Secrets Manager connection error codes
 */
export const SECRETS_MANAGER_CONNECTION_ERROR = {
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
export const SECRETS_MANAGER_OPERATION_ERROR = {
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
 * @description AWS Secrets Manager exception handler
 * Categorizes and handles AWS Secrets Manager SDK errors
 */
export class SecretsManagerException extends ExceptionHandler {
    constructor(error: any, context?: { secretName?: string; operation?: string }) {
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
    private categorizeSecretsManagerError(error: any, context?: { secretName?: string; operation?: string }): {
        type: ExceptionMessage;
        message: string;
        name: string;
        status: HTTP_STATUS_MESSAGE;
    } {
        const message = (error?.message || '').toLowerCase();
        const name = (error?.name || '').toLowerCase();
        const code = error?.name || error?.Code || '';
        const httpStatusCode = error?.$metadata?.httpStatusCode || 500;

        // ------------------
        // Connection Errors
        // ------------------
        const connectionMatches = [
            SECRETS_MANAGER_CONNECTION_ERROR.ECONNREFUSED,
            SECRETS_MANAGER_CONNECTION_ERROR.ENOTFOUND,
            SECRETS_MANAGER_CONNECTION_ERROR.ECONNRESET,
            SECRETS_MANAGER_CONNECTION_ERROR.EHOSTUNREACH,
            SECRETS_MANAGER_CONNECTION_ERROR.EADDRNOTAVAIL,
            SECRETS_MANAGER_CONNECTION_ERROR.ETIMEDOUT,
            SECRETS_MANAGER_CONNECTION_ERROR.NETWORK_ERROR,
            SECRETS_MANAGER_CONNECTION_ERROR.TIMEOUT_ERROR,
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

        if (
            authMatches.some((m) => 
                code?.toLowerCase().includes(m.toLowerCase()) || 
                message.includes(m.toLowerCase()) || 
                name.includes(m.toLowerCase())
            )
        ) {
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
            SECRETS_MANAGER_OPERATION_ERROR.RESOURCE_NOT_FOUND,
            'resourcenotfound',
            'notfound',
            'secretnotfound'
        ];

        if (
            notFoundMatches.some((m) => 
                code?.toLowerCase().includes(m.toLowerCase()) || 
                message.includes(m.toLowerCase()) || 
                name.includes(m.toLowerCase())
            )
        ) {
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
            SECRETS_MANAGER_OPERATION_ERROR.INVALID_PARAMETER,
            SECRETS_MANAGER_OPERATION_ERROR.INVALID_REQUEST,
            SECRETS_MANAGER_OPERATION_ERROR.MALFORMED_POLICY_DOCUMENT,
            'InvalidParameter',
            'InvalidRequest',
            'MalformedPolicyDocument',
            'validation',
            'invalid'
        ];

        if (
            validationMatches.some((m) => 
                code?.toLowerCase().includes(m.toLowerCase()) || 
                message.includes(m.toLowerCase()) || 
                name.includes(m.toLowerCase())
            )
        ) {
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
        if (
            code?.toLowerCase().includes('decryption') || 
            message.includes('decryption') || 
            name.includes('decryption')
        ) {
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
        if (
            code === 'RequestTimeout' || 
            message.includes('timeout') || 
            name.includes('timeout') ||
            httpStatusCode === 408
        ) {
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
                status: <HTTP_STATUS_MESSAGE>httpStatusCode || HTTP_STATUS_MESSAGE.BAD_REQUEST
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
