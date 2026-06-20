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
 * @description Exception message types for Secrets Manager operations
 */
export declare enum ExceptionMessage {
    SECRETS_MANAGER_CONNECTION_ERROR = "SECRETS_MANAGER_CONNECTION_ERROR",
    SECRETS_MANAGER_OPERATION_ERROR = "SECRETS_MANAGER_OPERATION_ERROR",
    SECRETS_MANAGER_AUTH_ERROR = "SECRETS_MANAGER_AUTH_ERROR",
    SECRETS_MANAGER_NOT_FOUND = "SECRETS_MANAGER_NOT_FOUND",
    SECRETS_MANAGER_SERVER_ERROR = "SECRETS_MANAGER_SERVER_ERROR",
    SECRETS_MANAGER_TIMEOUT_ERROR = "SECRETS_MANAGER_TIMEOUT_ERROR",
    SECRETS_MANAGER_VALIDATION_ERROR = "SECRETS_MANAGER_VALIDATION_ERROR",
    SECRETS_MANAGER_UNKNOWN_ERROR = "SECRETS_MANAGER_UNKNOWN_ERROR"
}
/**
 * @description Secrets Manager connection error codes
 */
export declare const SECRETS_MANAGER_CONNECTION_ERROR: {
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
 * @description Secrets Manager operation error codes
 */
export declare const SECRETS_MANAGER_OPERATION_ERROR: {
    RESOURCE_NOT_FOUND: string;
    INVALID_PARAMETER: string;
    INVALID_REQUEST: string;
    DECRYPTION_FAILURE: string;
    INTERNAL_SERVICE_ERROR: string;
    INVALID_NEXT_TOKEN: string;
    MALFORMED_POLICY_DOCUMENT: string;
    PRECONDITION_NOT_MET: string;
    PUBLIC_POLICY_EXCEPTION: string;
    RESOURCE_EXISTS: string;
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
 * @description AWS Secrets Manager exception handler
 * Categorizes and handles AWS Secrets Manager SDK errors
 */
export declare class SecretsManagerException extends ExceptionHandler {
    constructor(error: any, context?: {
        secretName?: string;
        operation?: string;
    });
    /**
     * @description Categorize Secrets Manager error based on error type and code
     * @param {any} error - AWS SDK error object
     * @param {object} context - Additional context (secretName, operation)
     * @returns {object} Categorized error information
     */
    private categorizeSecretsManagerError;
}
