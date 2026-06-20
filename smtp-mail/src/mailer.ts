import nodemailer, { SentMessageInfo, Transporter } from 'nodemailer';
import type { SendMailOptions } from 'nodemailer';
import { ISmtpInitOptions } from './interface';

/**
 * @description SMTP mail provider using Nodemailer
 * Initialize once with a config object (same pattern as Redis initiateRedisConnection), then send mail.
 * Logs use only non-sensitive metadata (no passwords, auth details, addresses, or subjects).
 */
export class SmtpMailProvider {
    private transporter: Transporter | null = null;
    private defaultFrom?: string;

    /**
     * @description Initialize SMTP transport from provided configuration
     * Only creates the transporter if not already initialized (mirrors initiateRedisConnection pattern)
     * @param {ISmtpInitOptions} config - Nodemailer SMTP transport options; optional `defaultFrom` for messages without `from`
     */
    initiateSMTPConnection(config: ISmtpInitOptions): void {
        if (!this.transporter) {
            const { defaultFrom, ...transportOptions } = config;
            this.defaultFrom = defaultFrom;
            this.transporter = nodemailer.createTransport(transportOptions);
            console.info(
                'SMTP transport initialized successfully',
                JSON.stringify({
                    host: transportOptions.host,
                    port: transportOptions.port,
                    secure: transportOptions.secure,
                    requireTLS: transportOptions.requireTLS,
                    hasAuth: Boolean(transportOptions.auth)
                })
            );
        } else {
            console.info('SMTP transport already initialized; skipping initiateSMTPConnection.');
        }
    }

    /**
     * @description Verify SMTP connection (optional health check)
     */
    async verify(): Promise<void> {
        const transport = this.getTransport();
        try {
            await transport.verify();
            console.info('SMTP connection verified successfully');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('SMTP connection verify failed:', message);
            throw error;
        }
    }

    /**
     * @description Send an email using Nodemailer
     * Uses `from` from options, or falls back to `defaultFrom` set during `initiateSMTPConnection`.
     * @param {SendMailOptions} options - to, subject, text/html, attachments, etc.
     * @returns {Promise<SentMessageInfo>} Nodemailer send result
     */
    async sendMail(options: SendMailOptions): Promise<SentMessageInfo> {
        const transport = this.getTransport();
        const from = options.from ?? this.defaultFrom;
        if (from === undefined || from === null || from === '') {
            throw new Error(
                'Missing "from". Pass `from` in sendMail options or set `defaultFrom` in initiateSMTPConnection config.'
            );
        }
        try {
            const result = await transport.sendMail({ ...options, from });
            if (result.messageId) {
                console.info('SMTP mail sent successfully', JSON.stringify({ messageId: result.messageId }));
            } else {
                console.info('SMTP mail sent successfully');
            }
            return result;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('SMTP sendMail failed:', message);
            throw error;
        }
    }

    /**
     * @description Get underlying transporter if configured
     */
    getTransport(): Transporter {
        if (!this.transporter) {
            throw new Error(
                'SMTP is not configured. Call initiateSMTPConnection(config) before sendMail or verify.'
            );
        }
        return this.transporter;
    }
}

export const smtpMail = new SmtpMailProvider();
