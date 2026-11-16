/**
 * @description AWS SES client initialization options
 */
export interface ISESInitOptions {
    region: string;
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
    };
    /** Used when send methods omit `from` */
    defaultFrom?: string;
    /** Optional SES configuration set applied to sends */
    configurationSetName?: string;
}
/**
 * @description Email attachment (raw MIME path)
 */
export interface ISESAttachment {
    filename: string;
    content: Buffer | string;
    contentType?: string;
    /** Content-ID for inline images */
    cid?: string;
}
/**
 * @description App-owned HTML / text send (+ optional attachments)
 */
export interface ISESSendMailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string | string[];
    attachments?: ISESAttachment[];
}
/**
 * @description SES stored template send.
 * Attachments force hydrate + Raw MIME because Content.Template cannot carry files.
 */
export interface ISESSendTemplatedMailOptions {
    to: string | string[];
    templateName: string;
    /** Object serialized to TemplateData JSON for {{placeholders}} */
    templateData: Record<string, unknown>;
    from?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string | string[];
    attachments?: ISESAttachment[];
}
/**
 * @description Create / update template body stored in SES
 */
export interface ISESTemplateDefinition {
    templateName: string;
    subject: string;
    html?: string;
    text?: string;
}
/**
 * @description One destination in a bulk send
 */
export interface ISESBulkDestination {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    /** Per-recipient template data (merged over defaultTemplateData) */
    templateData?: Record<string, unknown>;
    html?: string;
    text?: string;
    subject?: string;
}
/**
 * @description Bulk raw / simple HTML send
 */
export interface ISESSendBulkMailOptions {
    defaultSubject: string;
    defaultHtml?: string;
    defaultText?: string;
    from?: string;
    replyTo?: string | string[];
    attachments?: ISESAttachment[];
    destinations: ISESBulkDestination[];
    /** Max destinations processed per batch (default 50) */
    batchSize?: number;
}
/**
 * @description Bulk templated send
 */
export interface ISESSendBulkTemplatedMailOptions {
    templateName: string;
    defaultTemplateData?: Record<string, unknown>;
    from?: string;
    replyTo?: string | string[];
    destinations: ISESBulkDestination[];
    batchSize?: number;
    /**
     * Shared attachments. When set, each destination is hydrated and sent as Raw MIME
     * because SendBulkEmail template content cannot carry MIME attachments.
     */
    attachments?: ISESAttachment[];
}
/**
 * @description Result of a send operation
 */
export interface ISESSendResult {
    messageId: string;
}
/**
 * @description Result of a bulk send
 */
export interface ISESBulkSendResult {
    messageIds: string[];
}
