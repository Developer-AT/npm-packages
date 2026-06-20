/**
 * @description Logger utility class for structured logging with trace context
 * Provides methods to log messages with trace ID, user ID, and request source information
 */
export declare class LoggerUtils {
    private traceId?;
    private userId?;
    private requestFrom?;
    private WL;
    /**
     * @description Initialize LoggerUtils with Winston logger instance
     */
    constructor();
    /**
     * @description Set trace ID for request tracking
     * @param {string} traceId - Unique trace identifier for the request
     */
    setTraceId(traceId: string): void;
    /**
     * @description Set user ID for logging context
     * @param {string} userId - User identifier
     */
    setUserId(userId: string): void;
    /**
     * @description Set request source for logging context
     * @param {string} requestFrom - Source of the request (e.g., 'API', 'Worker', 'Cron')
     */
    setRequestFrom(requestFrom: string): void;
    /**
     * @description Get user ID for logging context
     * @returns {string} User identifier
     */
    getUserId(): string | undefined;
    /**
     * @description Get request source for logging context
     * @returns {string} Source of the request (e.g., 'API', 'Worker', 'Cron')
     */
    getRequestFrom(): string | undefined;
    /**
     * @description Get trace ID for request tracking
     * @returns {string} Unique trace identifier for the request
     */
    getTraceId(): string | undefined;
    /**
     * @description Get trace information object
     * @returns {Object} Object containing traceId, userId, and requestFrom
     */
    private traceInfo;
    /**
     * @description Plain informational log (no trace / user / requestFrom metadata)
     * @param {...any} logs - Values forwarded to Winston as a single array argument
     */
    pInfo(...logs: any[]): void;
    /**
     * @description Plain warning log (no trace / user / requestFrom metadata)
     * @param {...any} logs - Values forwarded to Winston as a single array argument
     */
    pWarn(...logs: any[]): void;
    /**
     * @description Plain error log (no trace / user / requestFrom metadata)
     * @param {...any} logs - Values forwarded to Winston as a single array argument
     */
    pError(...logs: any[]): void;
    /**
     * @description Log informational message
     * @param {...any} logs - One or more log messages or objects to log
     */
    info(...logs: any[]): void;
    /**
     * @description Log warning message
     * @param {...any} logs - One or more log messages or objects to log
     */
    warn(...logs: any[]): void;
    /**
     * @description Log error message
     * @param {...any} logs - One or more log messages or objects to log
     */
    error(...logs: any[]): void;
}
export declare const logger: LoggerUtils;
