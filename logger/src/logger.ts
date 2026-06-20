import { WinstonLogger } from "./winston.logger";

/**
 * @description Logger utility class for structured logging with trace context
 * Provides methods to log messages with trace ID, user ID, and request source information
 */
export class LoggerUtils {
  private traceId?: string;
  private userId?: string;
  private requestFrom?: string;
  private WL: WinstonLogger;

  /**
   * @description Initialize LoggerUtils with Winston logger instance
   */
  constructor() {
    this.WL = new WinstonLogger();
  }

  /**
   * @description Set trace ID for request tracking
   * @param {string} traceId - Unique trace identifier for the request
   */
  setTraceId(traceId: string) {
    this.traceId = traceId;
  }

  /**
   * @description Set user ID for logging context
   * @param {string} userId - User identifier
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * @description Set request source for logging context
   * @param {string} requestFrom - Source of the request (e.g., 'API', 'Worker', 'Cron')
   */
  setRequestFrom(requestFrom: string) {
    this.requestFrom = requestFrom;
  }

  /**
   * @description Get user ID for logging context
   * @returns {string} User identifier
   */
  getUserId(): string | undefined {
    return this.userId;
  }

  /**
   * @description Get request source for logging context
   * @returns {string} Source of the request (e.g., 'API', 'Worker', 'Cron')
   */
  getRequestFrom(): string | undefined {
    return this.requestFrom;
  }

  /**
   * @description Get trace ID for request tracking
   * @returns {string} Unique trace identifier for the request
   */
  getTraceId(): string | undefined {
    return this.traceId;
  }

  /**
   * @description Get trace information object
   * @returns {Object} Object containing traceId, userId, and requestFrom
   */
  private traceInfo() {
    return {
      traceId: this.traceId || "N/A",
      userId: this.userId || "N/A",
      requestFrom: this.requestFrom || "N/A"
    };
  }

  /**
   * @description Plain informational log (no trace / user / requestFrom metadata)
   * @param {...any} logs - Values forwarded to Winston as a single array argument
   */
  pInfo(...logs: any[]) {
    this.WL.logger.info(logs);
  }

  /**
   * @description Plain warning log (no trace / user / requestFrom metadata)
   * @param {...any} logs - Values forwarded to Winston as a single array argument
   */
  pWarn(...logs: any[]) {
    this.WL.logger.warn(logs);
  }

  /**
   * @description Plain error log (no trace / user / requestFrom metadata)
   * @param {...any} logs - Values forwarded to Winston as a single array argument
   */
  pError(...logs: any[]) {
    this.WL.logger.error(logs);
  }

  /**
   * @description Log informational message
   * @param {...any} logs - One or more log messages or objects to log
   */
  info(...logs: any[]) {
    this.WL.logger.info({ trace: this.traceInfo(), logs });
  }

  /**
   * @description Log warning message
   * @param {...any} logs - One or more log messages or objects to log
   */
  warn(...logs: any[]) {
    this.WL.logger.warn({ trace: this.traceInfo(), logs });
  }

  /**
   * @description Log error message
   * @param {...any} logs - One or more log messages or objects to log
   */
  error(...logs: any[]) {
    this.WL.logger.error({ trace: this.traceInfo(), logs });
  }
}

export const logger = new LoggerUtils();
