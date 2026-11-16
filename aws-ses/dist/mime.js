"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRawMessage = buildRawMessage;
const mail_composer_1 = __importDefault(require("nodemailer/lib/mail-composer"));
/**
 * @description Build an RFC822 message buffer for SES Content.Raw
 */
async function buildRawMessage(options) {
    const composer = new mail_composer_1.default({
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
function toNodemailerAttachment(attachment) {
    return {
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
        cid: attachment.cid
    };
}
//# sourceMappingURL=mime.js.map