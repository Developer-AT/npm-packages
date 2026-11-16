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
 * @description Exception message types for SES operations
 */
export declare enum ExceptionMessage {
    SES_CONNECTION_ERROR = "SES_CONNECTION_ERROR",
    SES_OPERATION_ERROR = "SES_OPERATION_ERROR",
    SES_VALIDATION_ERROR = "SES_VALIDATION_ERROR",
    SES_NOT_FOUND = "SES_NOT_FOUND",
    SES_UNKNOWN_ERROR = "SES_UNKNOWN_ERROR"
}
/**
 * @description Base exception handler class
 */
export declare class ExceptionHandler {
    protected code: number;
    protected status: HTTP_STATUS_MESSAGE;
    protected data: any;
    /**
     * @description Get error response object
     */
    getError(): {
        status: HTTP_STATUS_MESSAGE;
        data: any;
    };
}
/**
 * @description AWS SES exception handler
 */
export declare class SESException extends ExceptionHandler {
    constructor(error: unknown, context?: {
        operation?: string;
        templateName?: string;
    });
}
