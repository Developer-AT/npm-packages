"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smtpMail = exports.SmtpMailProvider = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
/**
 * @description SMTP mail provider using Nodemailer
 * Initialize once with a config object (same pattern as Redis initiateRedisConnection), then send mail
 */
class SmtpMailProvider {
    transporter = null;
    /**
     * @description Initialize SMTP transport from provided configuration
     * Only creates the transporter if not already initialized (mirrors initiateRedisConnection pattern)
     * @param {ISmtpConfig} config - SMTP host, port, auth, TLS, etc.
     */
    initiateSMTPConnection(config) {
        if (!this.transporter) {
            this.transporter = nodemailer_1.default.createTransport(config);
        }
    }
    /**
     * @description Verify SMTP connection (optional health check)
     */
    async verify() {
        const transport = this.getTransport();
        await transport.verify();
    }
    /**
     * @description Send an email using Nodemailer
     * @param {SendMailOptions} options - from, to, subject, text/html, attachments, etc.
     * @returns {Promise<SentMessageInfo>} Nodemailer send result
     */
    async sendMail(options) {
        const transport = this.getTransport();
        return transport.sendMail(options);
    }
    /**
     * @description Get underlying transporter if configured
     */
    getTransport() {
        if (!this.transporter) {
            throw new Error('SMTP is not configured. Call initiateSMTPConnection(config) before sendMail or verify.');
        }
        return this.transporter;
    }
}
exports.SmtpMailProvider = SmtpMailProvider;
exports.smtpMail = new SmtpMailProvider();
//# sourceMappingURL=mailer.js.map