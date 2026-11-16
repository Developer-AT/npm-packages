# @appinventiv/aws-ses

AWS SES email for Node.js using [`@aws-sdk/client-sesv2`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/sesv2/). Initialize once, then send app-owned HTML, stored SES templates, attachments, and batched bulk mail.

## Installation

```bash
npm install @appinventiv/aws-ses
```

## Features

- `initiateSES(config)` — region required; credentials optional (omit them to use the default AWS credential chain)
- `sendMail` — HTML / text as a raw MIME message, with optional attachments
- `sendTemplatedMail` — SES stored template; attachments hydrate `{{placeholders}}` and send raw MIME
- `sendBulkMail` / `sendBulkTemplatedMail` — destinations in batches (default 50)
- Template CRUD: `createTemplate`, `updateTemplate`, `deleteTemplate`, `getTemplate`
- Optional `configurationSetName` applied to sends

## Initialize

```typescript
import { ses } from '@appinventiv/aws-ses';

ses.initiateSES({
  region: 'us-east-1',
  defaultFrom: 'noreply@example.com',
  configurationSetName: 'app-emails' // optional
});
```

Explicit credentials are optional:

```typescript
ses.initiateSES({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  },
  defaultFrom: 'noreply@example.com'
});
```

`initiateSES` runs once. A second call is ignored. Pass `from` on a send, or set `defaultFrom` at init. `to` is required; `cc`, `bcc`, and `replyTo` are optional.

## App HTML

```typescript
await ses.sendMail({
  to: 'user@example.com',
  cc: 'ops@example.com',
  subject: 'Hello',
  html: '<p>Hi</p>',
  text: 'Hi',
  attachments: [
    { filename: 'notes.txt', content: 'hello', contentType: 'text/plain' }
  ]
});
```

Provide at least one of `html` or `text`. Attachments accept `content` as a `Buffer` or string, plus optional `contentType` and `cid` (inline images).

## Stored templates

Create a template in SES. Placeholders are `{{name}}` or `{{user.email}}`.

```typescript
await ses.createTemplate({
  templateName: 'InvoiceEmail',
  subject: 'Invoice for {{name}}',
  html: '<p>Hi {{name}}, amount {{amount}}</p>',
  text: 'Hi {{name}}, amount {{amount}}'
});
```

Without attachments, SES renders the template:

```typescript
await ses.sendTemplatedMail({
  to: 'user@example.com',
  templateName: 'InvoiceEmail',
  templateData: { name: 'Alex', amount: '99' }
});
```

With attachments, the package loads the template, replaces `{{placeholders}}`, and sends raw MIME. SES template content cannot carry files.

```typescript
await ses.sendTemplatedMail({
  to: 'user@example.com',
  templateName: 'InvoiceEmail',
  templateData: { name: 'Alex', amount: '99' },
  attachments: [{ filename: 'invoice.pdf', content: pdfBuffer, contentType: 'application/pdf' }]
});
```

`updateTemplate`, `deleteTemplate(templateName)`, and `getTemplate(templateName)` map to the SES template APIs. Replacement is simple token substitution, not Handlebars.

## Bulk sends

`batchSize` defaults to 50. A failed send throws; earlier messages in the batch may already have been accepted.

Shared HTML, with optional per-destination subject / html / text and shared attachments:

```typescript
await ses.sendBulkMail({
  defaultSubject: 'Update',
  defaultHtml: '<p>Hello</p>',
  destinations: [
    { to: 'a@example.com' },
    { to: 'b@example.com', subject: 'Update for B' }
  ]
});
```

Templated bulk without attachments uses SES `SendBulkEmail`. Each destination’s `templateData` is merged over `defaultTemplateData`.

```typescript
await ses.sendBulkTemplatedMail({
  templateName: 'WelcomeEmail',
  defaultTemplateData: { company: 'Acme' },
  destinations: [
    { to: 'a@example.com', templateData: { name: 'A' } },
    { to: 'b@example.com', templateData: { name: 'B' } }
  ]
});
```

Templated bulk with `attachments` hydrates each destination and sends raw MIME (same limit as a single templated send with files).

## Errors

SDK and validation failures throw the object from `SESException.getError()` (`status` and `data`). Call `ses.getClient()` only after `initiateSES`; otherwise it throws.

## API

| Method | Returns |
|--------|---------|
| `initiateSES(config)` | `void` |
| `sendMail(options)` | `{ messageId }` |
| `sendTemplatedMail(options)` | `{ messageId }` |
| `sendBulkMail(options)` | `{ messageIds }` |
| `sendBulkTemplatedMail(options)` | `{ messageIds }` |
| `createTemplate` / `updateTemplate` | `void` |
| `deleteTemplate(templateName)` | `void` |
| `getTemplate(templateName)` | template definition |
| `getClient()` | `SESv2Client` |
