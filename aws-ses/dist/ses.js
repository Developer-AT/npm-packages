"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ses = exports.AWSSESProvider = void 0;
const client_sesv2_1 = require("@aws-sdk/client-sesv2");
const exception_handler_1 = require("./exception-handler");
const mime_1 = require("./mime");
const template_1 = require("./template");
const DEFAULT_BATCH_SIZE = 50;
const RAW_CONCURRENCY = 8;
/**
 * @description AWS SES provider for raw HTML, stored templates, attachments, and bulk sends
 */
class AWSSESProvider {
    client = null;
    defaultFrom;
    configurationSetName;
    region;
    /**
     * @description Initialize SESv2 client once
     * @param {ISESInitOptions} config - Region, optional credentials, defaultFrom, configuration set
     */
    initiateSES(config) {
        if (this.client) {
            console.info('SES client already initialized; skipping initiateSES.');
            return;
        }
        try {
            const clientConfig = { region: config.region };
            if (config.credentials) {
                clientConfig.credentials = config.credentials;
            }
            this.client = new client_sesv2_1.SESv2Client(clientConfig);
            this.defaultFrom = config.defaultFrom;
            this.configurationSetName = config.configurationSetName;
            this.region = config.region;
            console.info('SES client initialized successfully', JSON.stringify({ region: config.region }));
        }
        catch (error) {
            console.error('SES initiateSES failed:', errorMessage(error));
            throw new exception_handler_1.SESException(error, { operation: 'initiateSES' }).getError();
        }
    }
    /**
     * @description Send app-owned HTML/text, optionally with attachments, via Content.Raw
     */
    async sendMail(options) {
        const from = this.resolveFrom(options.from);
        this.assertContent(options.html, options.text);
        this.assertAddresses(options.to);
        try {
            const raw = await (0, mime_1.buildRawMessage)({ ...options, from });
            const response = await this.getClient().send(new client_sesv2_1.SendEmailCommand({
                FromEmailAddress: from,
                Destination: destinationOf(options.to, options.cc, options.bcc),
                ReplyToAddresses: asAddressList(options.replyTo),
                ConfigurationSetName: this.configurationSetName,
                Content: { Raw: { Data: raw } }
            }));
            const messageId = response.MessageId || '';
            console.info('SES mail sent successfully', JSON.stringify({ messageId, region: this.region }));
            return { messageId };
        }
        catch (error) {
            console.error('SES sendMail failed:', errorMessage(error));
            throw new exception_handler_1.SESException(error, { operation: 'sendMail' }).getError();
        }
    }
    /**
     * @description Send a stored SES template.
     * Without attachments uses Content.Template. With attachments hydrates the template and sends Raw MIME.
     */
    async sendTemplatedMail(options) {
        const from = this.resolveFrom(options.from);
        this.assertAddresses(options.to);
        if (!options.templateName) {
            throw new exception_handler_1.SESException(new Error('templateName is required'), { operation: 'sendTemplatedMail' }).getError();
        }
        if (options.attachments?.length) {
            const hydrated = (0, template_1.hydrateDefinition)(await this.getTemplate(options.templateName), options.templateData || {});
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
            const response = await this.getClient().send(new client_sesv2_1.SendEmailCommand({
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
            }));
            const messageId = response.MessageId || '';
            console.info('SES templated mail sent successfully', JSON.stringify({ messageId, templateName: options.templateName, region: this.region }));
            return { messageId };
        }
        catch (error) {
            console.error('SES sendTemplatedMail failed:', errorMessage(error));
            throw new exception_handler_1.SESException(error, { operation: 'sendTemplatedMail', templateName: options.templateName }).getError();
        }
    }
    /**
     * @description Send the same HTML/text (and optional shared attachments) to many destinations in batches
     */
    async sendBulkMail(options) {
        if (!options.destinations?.length) {
            throw new exception_handler_1.SESException(new Error('destinations is required'), { operation: 'sendBulkMail' }).getError();
        }
        const messageIds = [];
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
    async sendBulkTemplatedMail(options) {
        if (!options.templateName) {
            throw new exception_handler_1.SESException(new Error('templateName is required'), { operation: 'sendBulkTemplatedMail' }).getError();
        }
        if (!options.destinations?.length) {
            throw new exception_handler_1.SESException(new Error('destinations is required'), { operation: 'sendBulkTemplatedMail' }).getError();
        }
        if (options.attachments?.length) {
            const definition = await this.getTemplate(options.templateName);
            const messageIds = [];
            const batches = chunk(options.destinations, options.batchSize || DEFAULT_BATCH_SIZE);
            for (const batch of batches) {
                const ids = await mapWithConcurrency(batch, RAW_CONCURRENCY, async (destination) => {
                    const data = { ...(options.defaultTemplateData || {}), ...(destination.templateData || {}) };
                    const hydrated = (0, template_1.hydrateDefinition)(definition, data);
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
        const messageIds = [];
        const batches = chunk(options.destinations, options.batchSize || DEFAULT_BATCH_SIZE);
        try {
            for (const batch of batches) {
                const response = await this.getClient().send(new client_sesv2_1.SendBulkEmailCommand({
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
                }));
                for (const entry of response.BulkEmailEntryResults || []) {
                    if (entry.Status && entry.Status !== 'SUCCESS') {
                        throw new Error(`Bulk entry failed: ${entry.Status} ${entry.Error || ''}`.trim());
                    }
                    if (entry.MessageId) {
                        messageIds.push(entry.MessageId);
                    }
                }
            }
            console.info('SES bulk templated mail sent successfully', JSON.stringify({ count: messageIds.length, templateName: options.templateName, region: this.region }));
            return { messageIds };
        }
        catch (error) {
            console.error('SES sendBulkTemplatedMail failed:', errorMessage(error));
            throw new exception_handler_1.SESException(error, { operation: 'sendBulkTemplatedMail', templateName: options.templateName }).getError();
        }
    }
    /**
     * @description Create an email template in SES
     */
    async createTemplate(definition) {
        try {
            await this.getClient().send(new client_sesv2_1.CreateEmailTemplateCommand({
                TemplateName: definition.templateName,
                TemplateContent: templateContent(definition)
            }));
            console.info('SES template created', JSON.stringify({ templateName: definition.templateName }));
        }
        catch (error) {
            console.error('SES createTemplate failed:', errorMessage(error));
            throw new exception_handler_1.SESException(error, { operation: 'createTemplate', templateName: definition.templateName }).getError();
        }
    }
    /**
     * @description Update an existing SES email template
     */
    async updateTemplate(definition) {
        try {
            await this.getClient().send(new client_sesv2_1.UpdateEmailTemplateCommand({
                TemplateName: definition.templateName,
                TemplateContent: templateContent(definition)
            }));
            console.info('SES template updated', JSON.stringify({ templateName: definition.templateName }));
        }
        catch (error) {
            console.error('SES updateTemplate failed:', errorMessage(error));
            throw new exception_handler_1.SESException(error, { operation: 'updateTemplate', templateName: definition.templateName }).getError();
        }
    }
    /**
     * @description Delete an SES email template
     */
    async deleteTemplate(templateName) {
        try {
            await this.getClient().send(new client_sesv2_1.DeleteEmailTemplateCommand({ TemplateName: templateName }));
            console.info('SES template deleted', JSON.stringify({ templateName }));
        }
        catch (error) {
            console.error('SES deleteTemplate failed:', errorMessage(error));
            throw new exception_handler_1.SESException(error, { operation: 'deleteTemplate', templateName }).getError();
        }
    }
    /**
     * @description Load an SES email template
     */
    async getTemplate(templateName) {
        try {
            const response = await this.getClient().send(new client_sesv2_1.GetEmailTemplateCommand({ TemplateName: templateName }));
            return {
                templateName: response.TemplateName || templateName,
                subject: response.TemplateContent?.Subject || '',
                html: response.TemplateContent?.Html,
                text: response.TemplateContent?.Text
            };
        }
        catch (error) {
            console.error('SES getTemplate failed:', errorMessage(error));
            throw new exception_handler_1.SESException(error, { operation: 'getTemplate', templateName }).getError();
        }
    }
    /**
     * @description Underlying SESv2 client (throws if not initialized)
     */
    getClient() {
        if (!this.client) {
            throw new Error('SES is not configured. Call initiateSES(config) before sending mail.');
        }
        return this.client;
    }
    resolveFrom(from) {
        const resolved = from ?? this.defaultFrom;
        if (!resolved) {
            throw new Error('Missing "from". Pass `from` or set `defaultFrom` in initiateSES config.');
        }
        return resolved;
    }
    assertContent(html, text) {
        if (!html && !text) {
            throw new Error('Provide at least one of html or text.');
        }
    }
    assertAddresses(to) {
        if (!asAddressList(to)?.length) {
            throw new Error('At least one "to" address is required.');
        }
    }
}
exports.AWSSESProvider = AWSSESProvider;
/** Pre-configured SES provider singleton */
exports.ses = new AWSSESProvider();
function asAddressList(value) {
    if (!value) {
        return undefined;
    }
    const list = (Array.isArray(value) ? value : [value]).map((item) => item.trim()).filter(Boolean);
    return list.length ? list : undefined;
}
function destinationOf(to, cc, bcc) {
    return {
        ToAddresses: asAddressList(to),
        CcAddresses: asAddressList(cc),
        BccAddresses: asAddressList(bcc)
    };
}
function templateContent(definition) {
    return {
        Subject: definition.subject,
        Html: definition.html,
        Text: definition.text
    };
}
function chunk(items, size) {
    const batches = [];
    for (let index = 0; index < items.length; index += size) {
        batches.push(items.slice(index, index + size));
    }
    return batches;
}
async function mapWithConcurrency(items, limit, worker) {
    const results = new Array(items.length);
    let cursor = 0;
    async function run() {
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
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
//# sourceMappingURL=ses.js.map