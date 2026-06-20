import type { Options as SMTPTransportOptions } from 'nodemailer/lib/smtp-transport';
import type { SendMailOptions } from 'nodemailer';
/**
 * @description SMTP initialization options: full Nodemailer SMTP transport options plus optional default sender.
 * Pass any combination Nodemailer supports (host, port, secure, requireTLS, tls, auth, pool, etc.). No encryption enum — use the flags your provider documents.
 * `defaultFrom` is not sent to Nodemailer transport; it is stripped and used when `sendMail` omits `from`.
 */
export type ISmtpInitOptions = SMTPTransportOptions & {
    defaultFrom?: string;
};
/**
 * @description Alias for {@link ISmtpInitOptions} (backward-compatible name).
 */
export type ISmtpConfig = ISmtpInitOptions;
/**
 * @description Options for sending an email (Nodemailer SendMailOptions)
 */
export type ISendMailOptions = SendMailOptions;
