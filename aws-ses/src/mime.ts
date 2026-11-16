import MailComposer from 'nodemailer/lib/mail-composer';
import { ISESAttachment, ISESSendMailOptions } from './interface';

/**
 * @description Build an RFC822 message buffer for SES Content.Raw
 */
export async function buildRawMessage(options: ISESSendMailOptions & { from: string }): Promise<Buffer> {
    const composer = new MailComposer({
        from: options.from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: (options.attachments || []).map(toNodemailerAttachment)
    });

    return composer.compile().build();
}

function toNodemailerAttachment(attachment: ISESAttachment) {
    return {
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
        cid: attachment.cid
    };
}
