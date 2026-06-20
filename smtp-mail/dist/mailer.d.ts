import { SentMessageInfo, Transporter } from 'nodemailer';
import type { SendMailOptions } from 'nodemailer';
import { ISmtpInitOptions } from './interface';
/**
 * @description SMTP mail provider using Nodemailer
 * Initialize once with a config object (same pattern as Redis initiateRedisConnection), then send mail.
 * Logs use only non-sensitive metadata (no passwords, auth details, addresses, or subjects).
 */
export declare class SmtpMailProvider {
    private transporter;
    private defaultFrom?;
    /**
     * @description Initialize SMTP transport from provided configuration
     * Only creates the transporter if not already initialized (mirrors initiateRedisConnection pattern)
     * @param {ISmtpInitOptions} config - Nodemailer SMTP transport options; optional `defaultFrom` for messages without `from`
     */
    initiateSMTPConnection(config: ISmtpInitOptions): void;
    /**
     * @description Verify SMTP connection (optional health check)
     */
    verify(): Promise<void>;
    /**
     * @description Send an email using Nodemailer
     * Uses `from` from options, or falls back to `defaultFrom` set during `initiateSMTPConnection`.
     * @param {SendMailOptions} options - to, subject, text/html, attachments, etc.
     * @returns {Promise<SentMessageInfo>} Nodemailer send result
     */
    sendMail(options: SendMailOptions): Promise<SentMessageInfo>;
    /**
     * @description Get underlying transporter if configured
     */
    getTransport(): Transporter;
}
export declare const smtpMail: SmtpMailProvider;
