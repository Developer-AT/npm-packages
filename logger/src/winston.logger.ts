import { LoggerOptions, transports, Logger, createLogger, format } from 'winston';

/**
 * @description Winston logger wrapper class for structured logging
 * Configures and initializes Winston logger with console transport and formatted output
 */
export class WinstonLogger {
    public logger: Logger;
    private serviceName: string = process.env.SERVICE_NAME || '';
    private outputFormat: string = (process.env.LOG_OUTPUT_FORMAT || 'json').toLowerCase();

    /**
     * @description Initialize Winston logger instance
     */
    constructor() {
        this.initiateLogger();
    }

    /**
     * @description Initialize and configure Winston logger
     */
    initiateLogger() {
        this.logger = createLogger(this.getConfiguration());
    }

    /**
     * @description Fetch Configuration for Logger
     * @returns {LoggerOptions}
     */
    private getConfiguration(): LoggerOptions {
        const timestampFormat = format.timestamp({
            format: () => new Date().toISOString()
        });

        const selectedFormat =
            this.outputFormat === 'pretty'
                ? format.combine(
                      timestampFormat,
                      format.errors({ stack: true }),
                      format.prettyPrint()
                  )
                : format.combine(
                      timestampFormat,
                      format.errors({ stack: true }),
                      format.json()
                  );

        const winstonConfig: LoggerOptions = {
            transports: [new transports.Console()],
            format: format.combine(
                format.label({
                    label: this.serviceName
                }),
                selectedFormat
            ),
            defaultMeta: {
                service: this.serviceName
            },
            silent: false
        };
        return winstonConfig;
    }
}