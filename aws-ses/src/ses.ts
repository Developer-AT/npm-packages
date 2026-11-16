import {
    CreateEmailTemplateCommand,
    DeleteEmailTemplateCommand,
    GetEmailTemplateCommand,
    SESv2Client,
    SESv2ClientConfig,
    SendBulkEmailCommand,
    SendEmailCommand,
    UpdateEmailTemplateCommand
} from '@aws-sdk/client-sesv2';
import { SESException } from './exception-handler';
import {
    ISESBulkSendResult,
    ISESInitOptions,
    ISESSendBulkMailOptions,
    ISESSendBulkTemplatedMailOptions,
    ISESSendMailOptions,
    ISESSendResult,
    ISESSendTemplatedMailOptions,
    ISESTemplateDefinition
} from './interface';
import { buildRawMessage } from './mime';
import { hydrateDefinition } from './template';

const DEFAULT_BATCH_SIZE = 50;
const RAW_CONCURRENCY = 8;

/**
 * @description AWS SES provider for raw HTML, stored templates, attachments, and bulk sends
 */
export class AWSSESProvider {
    private client: SESv2Client | null = null;
    private defaultFrom?: string;
    private configurationSetName?: string;
    private region?: string;

    /**
     * @description Initialize SESv2 client once
     * @param {ISESInitOptions} config - Region, optional credentials, defaultFrom, configuration set
     */
    initiateSES(config: ISESInitOptions): void {
        if (this.client) {
            console.info('SES client already initialized; skipping initiateSES.');
            return;
        }

        try {
            const clientConfig: SESv2ClientConfig = { region: config.region };
            if (config.credentials) {
                clientConfig.credentials = config.credentials;
            }
            this.client = new SESv2Client(clientConfig);
            this.defaultFrom = config.defaultFrom;
            this.configurationSetName = config.configurationSetName;
            this.region = config.region;
            console.info('SES client initialized successfully', JSON.stringify({ region: config.region }));
        } catch (error: unknown) {
            console.error('SES initiateSES failed:', errorMessage(error));
            throw new SESException(error, { operation: 'initiateSES' }).getError();
        }
    }

    /**
     * @description Send app-owned HTML/text, optionally with attachments, via Content.Raw
     */
    async sendMail(options: ISESSendMailOptions): Promise<ISESSendResult> {
        const from = this.resolveFrom(options.from);
        this.assertContent(options.html, options.text);
        this.assertAddresses(options.to);

        try {
            const raw = await buildRawMessage({ ...options, from });
            const response = await this.getClient().send(
                new SendEmailCommand({
                    FromEmailAddress: from,
                    Destination: destinationOf(options.to, options.cc, options.bcc),
                    ReplyToAddresses: asAddressList(options.replyTo),
                    ConfigurationSetName: this.configurationSetName,
                    Content: { Raw: { Data: raw } }
                })
            );
            const messageId = response.MessageId || '';
            console.info('SES mail sent successfully', JSON.stringify({ messageId, region: this.region }));
            return { messageId };
        } catch (error: unknown) {
            console.error('SES sendMail failed:', errorMessage(error));
            throw new SESException(error, { operation: 'sendMail' }).getError();
        }
    }

    /**
     * @description Send a stored SES template.
     * Without attachments uses Content.Template. With attachments hydrates the template and sends Raw MIME.
     */
    async sendTemplatedMail(options: ISESSendTemplatedMailOptions): Promise<ISESSendResult> {
        const from = this.resolveFrom(options.from);
        this.assertAddresses(options.to);
        if (!options.templateName) {
            throw new SESException(new Error('templateName is required'), { operation: 'sendTemplatedMail' }).getError();
        }

        if (options.attachments?.length) {
            const hydrated = hydrateDefinition(await this.getTemplate(options.templateName), options.templateData || {});
            return this.sendMail({
                to: options.to,
                cc: options.cc,
                bcc: options.bcc,
                replyTo: options.replyTo,
                from,
                subject: hydrated.subject,
                html: hydrated.html,
                text: hydrated.text,
                attachments: options.attachments
            });
        }

        try {
            const response = await this.getClient().send(
                new SendEmailCommand({
                    FromEmailAddress: from,
                    Destination: destinationOf(options.to, options.cc, options.bcc),
                    ReplyToAddresses: asAddressList(options.replyTo),
                    ConfigurationSetName: this.configurationSetName,
                    Content: {
                        Template: {
                            TemplateName: options.templateName,
                            TemplateData: JSON.stringify(options.templateData || {})
                        }
                    }
                })
            );
            const messageId = response.MessageId || '';
            console.info(
                'SES templated mail sent successfully',
                JSON.stringify({ messageId, templateName: options.templateName, region: this.region })
            );
            return { messageId };
        } catch (error: unknown) {
            console.error('SES sendTemplatedMail failed:', errorMessage(error));
            throw new SESException(error, { operation: 'sendTemplatedMail', templateName: options.templateName }).getError();
        }
    }

    /**
     * @description Send the same HTML/text (and optional shared attachments) to many destinations in batches
     */
    async sendBulkMail(options: ISESSendBulkMailOptions): Promise<ISESBulkSendResult> {
        if (!options.destinations?.length) {
            throw new SESException(new Error('destinations is required'), { operation: 'sendBulkMail' }).getError();
        }

        const messageIds: string[] = [];
        const batches = chunk(options.destinations, options.batchSize || DEFAULT_BATCH_SIZE);

        for (const batch of batches) {
            const ids = await mapWithConcurrency(batch, RAW_CONCURRENCY, async (destination) => {
                const result = await this.sendMail({
                    to: destination.to,
                    cc: destination.cc,
                    bcc: destination.bcc,
                    from: options.from,
                    replyTo: options.replyTo,
                    subject: destination.subject || options.defaultSubject,
                    html: destination.html || options.defaultHtml,
                    text: destination.text || options.defaultText,
                    attachments: options.attachments
                });
                return result.messageId;
            });
            messageIds.push(...ids);
        }

        return { messageIds };
    }

    /**
     * @description Bulk templated send.
     * Without attachments uses SendBulkEmail. With attachments hydrates each destination and sends Raw MIME.
     */
    async sendBulkTemplatedMail(options: ISESSendBulkTemplatedMailOptions): Promise<ISESBulkSendResult> {
        if (!options.templateName) {
            throw new SESException(new Error('templateName is required'), { operation: 'sendBulkTemplatedMail' }).getError();
        }
        if (!options.destinations?.length) {
            throw new SESException(new Error('destinations is required'), { operation: 'sendBulkTemplatedMail' }).getError();
        }

        if (options.attachments?.length) {
            const definition = await this.getTemplate(options.templateName);
            const messageIds: string[] = [];
            const batches = chunk(options.destinations, options.batchSize || DEFAULT_BATCH_SIZE);

            for (const batch of batches) {
                const ids = await mapWithConcurrency(batch, RAW_CONCURRENCY, async (destination) => {
                    const data = { ...(options.defaultTemplateData || {}), ...(destination.templateData || {}) };
                    const hydrated = hydrateDefinition(definition, data);
                    const result = await this.sendMail({
                        to: destination.to,
                        cc: destination.cc,
                        bcc: destination.bcc,
                        from: options.from,
                        replyTo: options.replyTo,
                        subject: hydrated.subject,
                        html: hydrated.html,
                        text: hydrated.text,
                        attachments: options.attachments
                    });
                    return result.messageId;
                });
                messageIds.push(...ids);
            }

            return { messageIds };
        }

        const from = this.resolveFrom(options.from);
        const messageIds: string[] = [];
        const batches = chunk(options.destinations, options.batchSize || DEFAULT_BATCH_SIZE);

        try {
            for (const batch of batches) {
                const response = await this.getClient().send(
                    new SendBulkEmailCommand({
                        FromEmailAddress: from,
                        ReplyToAddresses: asAddressList(options.replyTo),
                        ConfigurationSetName: this.configurationSetName,
                        DefaultContent: {
                            Template: {
                                TemplateName: options.templateName,
                                TemplateData: JSON.stringify(options.defaultTemplateData || {})
                            }
                        },
                        BulkEmailEntries: batch.map((destination) => ({
                            Destination: destinationOf(destination.to, destination.cc, destination.bcc),
                            ReplacementEmailContent: {
                                ReplacementTemplate: {
                                    ReplacementTemplateData: JSON.stringify({
                                        ...(options.defaultTemplateData || {}),
                                        ...(destination.templateData || {})
                                    })
                                }
                            }
                        }))
                    })
                );

                for (const entry of response.BulkEmailEntryResults || []) {
                    if (entry.Status && entry.Status !== 'SUCCESS') {
                        throw new Error(`Bulk entry failed: ${entry.Status} ${entry.Error || ''}`.trim());
                    }
                    if (entry.MessageId) {
                        messageIds.push(entry.MessageId);
                    }
                }
            }

            console.info(
                'SES bulk templated mail sent successfully',
                JSON.stringify({ count: messageIds.length, templateName: options.templateName, region: this.region })
            );
            return { messageIds };
        } catch (error: unknown) {
            console.error('SES sendBulkTemplatedMail failed:', errorMessage(error));
            throw new SESException(error, { operation: 'sendBulkTemplatedMail', templateName: options.templateName }).getError();
        }
    }

    /**
     * @description Create an email template in SES
     */
    async createTemplate(definition: ISESTemplateDefinition): Promise<void> {
        try {
            await this.getClient().send(
                new CreateEmailTemplateCommand({
                    TemplateName: definition.templateName,
                    TemplateContent: templateContent(definition)
                })
            );
            console.info('SES template created', JSON.stringify({ templateName: definition.templateName }));
        } catch (error: unknown) {
            console.error('SES createTemplate failed:', errorMessage(error));
            throw new SESException(error, { operation: 'createTemplate', templateName: definition.templateName }).getError();
        }
    }

    /**
     * @description Update an existing SES email template
     */
    async updateTemplate(definition: ISESTemplateDefinition): Promise<void> {
        try {
            await this.getClient().send(
                new UpdateEmailTemplateCommand({
                    TemplateName: definition.templateName,
                    TemplateContent: templateContent(definition)
                })
            );
            console.info('SES template updated', JSON.stringify({ templateName: definition.templateName }));
        } catch (error: unknown) {
            console.error('SES updateTemplate failed:', errorMessage(error));
            throw new SESException(error, { operation: 'updateTemplate', templateName: definition.templateName }).getError();
        }
    }

    /**
     * @description Delete an SES email template
     */
    async deleteTemplate(templateName: string): Promise<void> {
        try {
            await this.getClient().send(new DeleteEmailTemplateCommand({ TemplateName: templateName }));
            console.info('SES template deleted', JSON.stringify({ templateName }));
        } catch (error: unknown) {
            console.error('SES deleteTemplate failed:', errorMessage(error));
            throw new SESException(error, { operation: 'deleteTemplate', templateName }).getError();
        }
    }

    /**
     * @description Load an SES email template
     */
    async getTemplate(templateName: string): Promise<ISESTemplateDefinition> {
        try {
            const response = await this.getClient().send(new GetEmailTemplateCommand({ TemplateName: templateName }));
            return {
                templateName: response.TemplateName || templateName,
                subject: response.TemplateContent?.Subject || '',
                html: response.TemplateContent?.Html,
                text: response.TemplateContent?.Text
            };
        } catch (error: unknown) {
            console.error('SES getTemplate failed:', errorMessage(error));
            throw new SESException(error, { operation: 'getTemplate', templateName }).getError();
        }
    }

    /**
     * @description Underlying SESv2 client (throws if not initialized)
     */
    getClient(): SESv2Client {
        if (!this.client) {
            throw new Error('SES is not configured. Call initiateSES(config) before sending mail.');
        }
        return this.client;
    }

    private resolveFrom(from?: string): string {
        const resolved = from ?? this.defaultFrom;
        if (!resolved) {
            throw new Error('Missing "from". Pass `from` or set `defaultFrom` in initiateSES config.');
        }
        return resolved;
    }

    private assertContent(html?: string, text?: string): void {
        if (!html && !text) {
            throw new Error('Provide at least one of html or text.');
        }
    }

    private assertAddresses(to: string | string[]): void {
        if (!asAddressList(to)?.length) {
            throw new Error('At least one "to" address is required.');
        }
    }
}

/** Pre-configured SES provider singleton */
export const ses = new AWSSESProvider();

function asAddressList(value?: string | string[]): string[] | undefined {
    if (!value) {
        return undefined;
    }
    const list = (Array.isArray(value) ? value : [value]).map((item) => item.trim()).filter(Boolean);
    return list.length ? list : undefined;
}

function destinationOf(to: string | string[], cc?: string | string[], bcc?: string | string[]) {
    return {
        ToAddresses: asAddressList(to),
        CcAddresses: asAddressList(cc),
        BccAddresses: asAddressList(bcc)
    };
}

function templateContent(definition: ISESTemplateDefinition) {
    return {
        Subject: definition.subject,
        Html: definition.html,
        Text: definition.text
    };
}

function chunk<T>(items: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        batches.push(items.slice(index, index + size));
    }
    return batches;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let cursor = 0;

    async function run(): Promise<void> {
        while (cursor < items.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await worker(items[index]);
        }
    }

    const runners = Array.from({ length: Math.min(limit, items.length) }, () => run());
    await Promise.all(runners);
    return results;
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
