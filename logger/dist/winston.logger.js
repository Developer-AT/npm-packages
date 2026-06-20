"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WinstonLogger = void 0;
const winston_1 = require("winston");
/**
 * @description Winston logger wrapper class for structured logging
 * Configures and initializes Winston logger with console transport and formatted output
 */
class WinstonLogger {
    logger;
    serviceName = process.env.SERVICE_NAME || '';
    outputFormat = (process.env.LOG_OUTPUT_FORMAT || 'json').toLowerCase();
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
        this.logger = (0, winston_1.createLogger)(this.getConfiguration());
    }
    /**
     * @description Fetch Configuration for Logger
     * @returns {LoggerOptions}
     */
    getConfiguration() {
        const timestampFormat = winston_1.format.timestamp({
            format: () => new Date().toISOString()
        });
        const selectedFormat = this.outputFormat === 'pretty'
            ? winston_1.format.combine(timestampFormat, winston_1.format.errors({ stack: true }), winston_1.format.prettyPrint())
            : winston_1.format.combine(timestampFormat, winston_1.format.errors({ stack: true }), winston_1.format.json());
        const winstonConfig = {
            transports: [new winston_1.transports.Console()],
            format: winston_1.format.combine(winston_1.format.label({
                label: this.serviceName
            }), selectedFormat),
            defaultMeta: {
                service: this.serviceName
            },
            silent: false
        };
        return winstonConfig;
    }
}
exports.WinstonLogger = WinstonLogger;
//# sourceMappingURL=winston.logger.js.map