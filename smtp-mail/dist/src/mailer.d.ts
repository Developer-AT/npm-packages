import { SentMessageInfo, Transporter } from 'nodemailer';
import type { SendMailOptions } from 'nodemailer';
import { ISmtpConfig } from './interface';
/**
 * @description SMTP mail provider using Nodemailer
 * Initialize once with a config object (same pattern as Redis initiateRedisConnection), then send mail
 */
export declare class SmtpMailProvider {
    private transporter;
    /**
     * @description Initialize SMTP transport from provided configuration
     * Only creates the transporter if not already initialized (mirrors initiateRedisConnection pattern)
     * @param {ISmtpConfig} config - SMTP host, port, auth, TLS, etc.
     */
    initiateSMTPConnection(config: ISmtpConfig): void;
    /**
     * @description Verify SMTP connection (optional health check)
     */
    verify(): Promise<void>;
    /**
     * @description Send an email using Nodemailer
     * @param {SendMailOptions} options - from, to, subject, text/html, attachments, etc.
     * @returns {Promise<SentMessageInfo>} Nodemailer send result
     */
    sendMail(options: SendMailOptions): Promise<SentMessageInfo>;
    /**
     * @description Get underlying transporter if configured
     */
    getTransport(): Transporter;
}
export declare const smtpMail: SmtpMailProvider;
