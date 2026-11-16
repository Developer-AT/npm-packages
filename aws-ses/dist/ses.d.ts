import { SESv2Client } from '@aws-sdk/client-sesv2';
import { ISESBulkSendResult, ISESInitOptions, ISESSendBulkMailOptions, ISESSendBulkTemplatedMailOptions, ISESSendMailOptions, ISESSendResult, ISESSendTemplatedMailOptions, ISESTemplateDefinition } from './interface';
/**
 * @description AWS SES provider for raw HTML, stored templates, attachments, and bulk sends
 */
export declare class AWSSESProvider {
    private client;
    private defaultFrom?;
    private configurationSetName?;
    private region?;
    /**
     * @description Initialize SESv2 client once
     * @param {ISESInitOptions} config - Region, optional credentials, defaultFrom, configuration set
     */
    initiateSES(config: ISESInitOptions): void;
    /**
     * @description Send app-owned HTML/text, optionally with attachments, via Content.Raw
     */
    sendMail(options: ISESSendMailOptions): Promise<ISESSendResult>;
    /**
     * @description Send a stored SES template.
     * Without attachments uses Content.Template. With attachments hydrates the template and sends Raw MIME.
     */
    sendTemplatedMail(options: ISESSendTemplatedMailOptions): Promise<ISESSendResult>;
    /**
     * @description Send the same HTML/text (and optional shared attachments) to many destinations in batches
     */
    sendBulkMail(options: ISESSendBulkMailOptions): Promise<ISESBulkSendResult>;
    /**
     * @description Bulk templated send.
     * Without attachments uses SendBulkEmail. With attachments hydrates each destination and sends Raw MIME.
     */
    sendBulkTemplatedMail(options: ISESSendBulkTemplatedMailOptions): Promise<ISESBulkSendResult>;
    /**
     * @description Create an email template in SES
     */
    createTemplate(definition: ISESTemplateDefinition): Promise<void>;
    /**
     * @description Update an existing SES email template
     */
    updateTemplate(definition: ISESTemplateDefinition): Promise<void>;
    /**
     * @description Delete an SES email template
     */
    deleteTemplate(templateName: string): Promise<void>;
    /**
     * @description Load an SES email template
     */
    getTemplate(templateName: string): Promise<ISESTemplateDefinition>;
    /**
     * @description Underlying SESv2 client (throws if not initialized)
     */
    getClient(): SESv2Client;
    private resolveFrom;
    private assertContent;
    private assertAddresses;
}
/** Pre-configured SES provider singleton */
export declare const ses: AWSSESProvider;
