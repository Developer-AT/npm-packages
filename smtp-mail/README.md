# @appinventiv/smtp-mail

SMTP email sending for Node.js using [Nodemailer](https://nodemailer.com/). Initialize the transport once with a **Nodemailer-native config object** (same idea as `initiateRedisConnection` in `@appinventiv/redis`), then send mail with standard options (HTML, text, attachments, etc.).

There is **no encryption enum** in this package: you set `secure`, `requireTLS`, `tls`, and `port` exactly as your SMTP provider requires. Below are **recipes** for common setups.

## Installation

```bash
npm install @appinventiv/smtp-mail
```

## Features

- Flexible SMTP transport: any fields supported by Nodemailer [`SMTPTransport` options](https://nodemailer.com/smtp/)
- Optional `auth` / password (omit when your server does not require credentials)
- Optional **`defaultFrom`**: used when `sendMail` does not include `from`
- Single initializer: `initiateSMTPConnection(config)` — only runs if not already initialized
- `verify()` for connection checks
- `sendMail()` with full Nodemailer `SendMailOptions`
- Attachments from a **public URL** using `href`
- TypeScript definitions (`ISmtpInitOptions`, `ISmtpConfig` alias, `ISendMailOptions`)

## Configuration model

- **`ISmtpInitOptions`** = Nodemailer `SMTPTransportOptions` + optional **`defaultFrom`**
- The **`defaultFrom`** field is **not** passed to `createTransport`; it is stored and merged into each `sendMail` when `from` is omitted.
- All other keys (`host`, `port`, `secure`, `requireTLS`, `auth`, `tls`, `pool`, …) are passed through to Nodemailer unchanged.

## Nodemailer TLS flags (`secure` and `requireTLS`)

These are the main levers for “TLS” vs “STARTTLS”. There is **no separate enum** in this package—you set them on the same object you pass to `initiateSMTPConnection`.

| `secure` | Meaning (typical use) |
|----------|------------------------|
| **`true`** | Connection uses **TLS from the first byte** (implicit TLS / SMTPS). Often called **“TLS”** or **“SSL”** in vendor docs. **Common port: 465.** |
| **`false`** | Connection starts **plain** (not TLS yet). The server may offer **STARTTLS** to upgrade. **Common ports: 587, sometimes 25.** |

| `requireTLS` | Meaning (use with `secure: false`) |
|--------------|----------------------------------------|
| **`true`** | After connecting in plain mode, a **TLS upgrade is required** (STARTTLS path). Use when your provider expects **STARTTLS** on port **587**. |
| **`false` or omitted** | STARTTLS may still be offered by the server, but behavior is **opportunistic** unless your provider says otherwise. For strict encrypted submission, prefer **`requireTLS: true`** on 587. |

**STARTTLS vs “TLS” in client wording**

- **STARTTLS** → usually **`secure: false`** + **`requireTLS: true`** + port **587** (confirm with provider).
- **TLS / SSL / SMTPS** (implicit) → **`secure: true`** + port **465** (confirm with provider).
- If the client says **“STARTTLS/TLS”**, they often mean **either** endpoint is valid: pick **one** row from your IT doc (587+STARTTLS **or** 465+implicit), not both at once.

## Configuration combinations (copy-paste reference)

Every example uses `ISmtpInitOptions`: transport fields + optional `defaultFrom`. Omit any field your server does not need.

### A — Host, port, username, password, default `from` (authenticated + default sender)

Use when you have full credentials and want a default envelope sender so `sendMail` can omit `from`.

**STARTTLS (typical 587):**

```typescript
smtpMail.initiateSMTPConnection({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: { user: 'user@example.com', pass: 'your-password' },
  defaultFrom: '"My App" <noreply@example.com>'
});
```

**Implicit TLS / SMTPS (typical 465, `secure: true`):**

```typescript
smtpMail.initiateSMTPConnection({
  host: 'smtp.example.com',
  port: 465,
  secure: true,
  auth: { user: 'user@example.com', pass: 'your-password' },
  defaultFrom: '"My App" <noreply@example.com>'
});
```

### B — Host, port, username, password (no `defaultFrom`)

Same TLS choices as A, but **each** `sendMail` must include `from`:

```typescript
smtpMail.initiateSMTPConnection({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: { user: 'user@example.com', pass: 'your-password' }
});

await smtpMail.sendMail({
  from: '"My App" <noreply@example.com>',
  to: 'user@example.com',
  subject: 'Hello',
  text: 'Hi'
});
```

### C — Host, port, username, `defaultFrom` (no password)

**Rare.** Only if your provider documents SMTP AUTH with an empty password or user-only. Otherwise prefer **D** (omit `auth`).

```typescript
smtpMail.initiateSMTPConnection({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: { user: 'user@example.com', pass: '' },
  defaultFrom: '"My App" <noreply@example.com>'
});
```

If authentication fails, remove `auth` or follow vendor docs exactly.

### D — Host, port, `defaultFrom` (no `auth`, no password)

Internal relay or open submission where **no SMTP auth** is required:

```typescript
smtpMail.initiateSMTPConnection({
  host: 'smtp.internal.local',
  port: 25,
  secure: false,
  defaultFrom: '"Service" <service@internal.local>'
});
```

### E — Host, port only (minimal)

No `defaultFrom`, no `auth`. You must pass **`from` on every `sendMail`** and your network must allow unauthenticated SMTP (uncommon on the public internet):

```typescript
smtpMail.initiateSMTPConnection({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  requireTLS: true
});
```

### F — Same as A–E plus extra Nodemailer options

Anything else from [Nodemailer SMTP transport](https://nodemailer.com/smtp/) can sit on the same object, for example:

- `tls: { rejectUnauthorized: true, ca: '...' }` — custom CA / stricter TLS
- `connectionTimeout`, `greetingTimeout`, `socketTimeout`
- `pool: true` — connection pooling for high volume

Example (implicit TLS + custom CA bundle):

```typescript
smtpMail.initiateSMTPConnection({
  host: 'smtp.example.com',
  port: 465,
  secure: true,
  auth: { user: 'user@example.com', pass: 'your-password' },
  defaultFrom: '"My App" <noreply@example.com>',
  tls: {
    // e.g. ca: fs.readFileSync('corp-ca.pem'),
    rejectUnauthorized: true
  }
});
```

## Summary table (quick pick)

| Goal | `secure` | `requireTLS` | Typical `port` |
|------|----------|--------------|----------------|
| STARTTLS (upgrade after connect) | `false` | `true` | `587` |
| Implicit TLS / SMTPS (“TLS” / “SSL”) | `true` | omit or `false` | `465` |
| Plain (insecure; internal only) | `false` | `false` | `25` / internal |

Always confirm **host**, **port**, and TLS mode with your provider; mismatches usually fail at `verify()` or the first `sendMail`.

## Usage

### Initialize and send

```typescript
import { smtpMail, ISmtpInitOptions } from '@appinventiv/smtp-mail';

const config: ISmtpInitOptions = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: 'user@example.com',
    pass: 'your-password'
  },
  defaultFrom: '"My App" <noreply@example.com>'
};

smtpMail.initiateSMTPConnection(config);
await smtpMail.verify();

await smtpMail.sendMail({
  to: 'user@example.com',
  subject: 'Hello',
  text: 'Plain text body'
});
```

If you omit `defaultFrom`, every `sendMail` must include `from`.

### Without password (no auth)

When your SMTP relay does not require credentials, omit `auth`:

```typescript
smtpMail.initiateSMTPConnection({
  host: 'smtp.internal.local',
  port: 25,
  secure: false,
  defaultFrom: '"Service" <service@internal.local>'
});
```

Behavior without `auth` is **provider-specific**; confirm with your infrastructure team.

### With username but no password (rare)

See **configuration combination C** above. Prefer **D** (omit `auth`) unless your provider requires an empty password.

## More detail

TLS flags, STARTTLS vs implicit TLS, and all credential combinations are documented in **Nodemailer TLS flags**, **Configuration combinations**, and **Summary table** above. This section avoids duplicating those examples.

## Attachments from a URL (`href`)

For a **publicly reachable** HTTPS link (no custom auth headers), use `href` on an attachment:

```typescript
await smtpMail.sendMail({
  to: 'user@example.com',
  subject: 'Your file',
  text: 'Please find the attachment.',
  attachments: [
    {
      filename: 'report.pdf',
      href: 'https://cdn.example.com/files/report.pdf'
    }
  ]
});
```

Presigned URLs work if still valid when `sendMail` runs. For URLs that need `Authorization` headers, download the file yourself and attach with `content` as a `Buffer`.

## API

- `smtpMail.initiateSMTPConnection(config: ISmtpInitOptions)` — create transporter once if not already created; optional `defaultFrom`
- `smtpMail.verify()` — verify SMTP connection
- `smtpMail.sendMail(options)` — send email (`from` optional if `defaultFrom` was set)
- `smtpMail.getTransport()` — underlying Nodemailer transporter

Types: **`ISmtpInitOptions`** (primary), **`ISmtpConfig`** (alias), **`ISendMailOptions`**.

## Troubleshooting

- **Connection / TLS errors**: confirm `host`, `port`, `secure`, and `requireTLS` match provider documentation.
- **Missing from**: set `defaultFrom` on init or pass `from` on each `sendMail`.

## Build

```bash
npm run build
```

## Security

Do not commit SMTP credentials. Load them from environment or a secrets manager, then pass them into the init config object.

## License

ISC
