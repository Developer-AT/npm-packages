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
 * @description Exception message types for SES operations
 */
export enum ExceptionMessage {
    SES_CONNECTION_ERROR = 'SES_CONNECTION_ERROR',
    SES_OPERATION_ERROR = 'SES_OPERATION_ERROR',
    SES_VALIDATION_ERROR = 'SES_VALIDATION_ERROR',
    SES_NOT_FOUND = 'SES_NOT_FOUND',
    SES_UNKNOWN_ERROR = 'SES_UNKNOWN_ERROR'
}

/**
 * @description Base exception handler class
 */
export class ExceptionHandler {
    protected code: number;
    protected status: HTTP_STATUS_MESSAGE;
    protected data: any;

    /**
     * @description Get error response object
     */
    getError() {
        return {
            status: this.status || HTTP_STATUS_MESSAGE.BAD_REQUEST,
            data: this.data
        };
    }
}

/**
 * @description AWS SES exception handler
 */
export class SESException extends ExceptionHandler {
    constructor(error: unknown, context?: { operation?: string; templateName?: string }) {
        super();
        const err = error as { name?: string; message?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
        const name = err?.name || err?.Code || 'SES_UNKNOWN_ERROR';
        const message = err?.message || 'Unknown SES error';
        const httpStatus = err?.$metadata?.httpStatusCode;

        if (name === 'NotFoundException' || httpStatus === 404) {
            this.status = HTTP_STATUS_MESSAGE.NOT_FOUND;
            this.data = { type: ExceptionMessage.SES_NOT_FOUND, message, ...context };
            return;
        }

        if (name === 'ValidationException' || name === 'BadRequestException' || httpStatus === 400) {
            this.status = HTTP_STATUS_MESSAGE.BAD_REQUEST;
            this.data = { type: ExceptionMessage.SES_VALIDATION_ERROR, message, ...context };
            return;
        }

        if (httpStatus === 401 || httpStatus === 403 || name === 'AccessDeniedException') {
            this.status = HTTP_STATUS_MESSAGE.FORBIDDEN;
            this.data = { type: ExceptionMessage.SES_OPERATION_ERROR, message, ...context };
            return;
        }

        this.status = HTTP_STATUS_MESSAGE.INTERNAL_SERVER_ERROR;
        this.data = { type: ExceptionMessage.SES_UNKNOWN_ERROR, message, ...context };
    }
}
