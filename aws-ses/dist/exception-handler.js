"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESException = exports.ExceptionHandler = exports.ExceptionMessage = exports.HTTP_STATUS_MESSAGE = void 0;
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
 * @description Exception message types for SES operations
 */
var ExceptionMessage;
(function (ExceptionMessage) {
    ExceptionMessage["SES_CONNECTION_ERROR"] = "SES_CONNECTION_ERROR";
    ExceptionMessage["SES_OPERATION_ERROR"] = "SES_OPERATION_ERROR";
    ExceptionMessage["SES_VALIDATION_ERROR"] = "SES_VALIDATION_ERROR";
    ExceptionMessage["SES_NOT_FOUND"] = "SES_NOT_FOUND";
    ExceptionMessage["SES_UNKNOWN_ERROR"] = "SES_UNKNOWN_ERROR";
})(ExceptionMessage || (exports.ExceptionMessage = ExceptionMessage = {}));
/**
 * @description Base exception handler class
 */
class ExceptionHandler {
    code;
    status;
    data;
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
exports.ExceptionHandler = ExceptionHandler;
/**
 * @description AWS SES exception handler
 */
class SESException extends ExceptionHandler {
    constructor(error, context) {
        super();
        const err = error;
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
exports.SESException = SESException;
//# sourceMappingURL=exception-handler.js.map