import type { Options as SMTPTransportOptions } from 'nodemailer/lib/smtp-transport';
import type { SendMailOptions } from 'nodemailer';
/**
 * @description SMTP connection configuration for Nodemailer transport
 */
export interface ISmtpConfig extends SMTPTransportOptions {
    host: string;
    port: number;
    auth: {
        user: string;
        pass: string;
    };
}
/**
 * @description Options for sending an email (Nodemailer SendMailOptions)
 */
export type ISendMailOptions = SendMailOptions;
