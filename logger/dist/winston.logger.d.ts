import { Logger } from 'winston';
/**
 * @description Winston logger wrapper class for structured logging
 * Configures and initializes Winston logger with console transport and formatted output
 */
export declare class WinstonLogger {
    logger: Logger;
    private serviceName;
    private outputFormat;
    /**
     * @description Initialize Winston logger instance
     */
    constructor();
    /**
     * @description Initialize and configure Winston logger
     */
    initiateLogger(): void;
    /**
     * @description Fetch Configuration for Logger
     * @returns {LoggerOptions}
     */
    private getConfiguration;
}
