# ADR 002: Email sender choice

- **Status:** Accepted
- **Date:** 2026-11-17
- **Issue:** #52

## Context

The optional accounts need to send emails:

| Email | Notes |
|---|---|
| Account confirmation | Contains a one-time link with a token (stored only as a hash) |
| Password reset | Contains a one-time link with a token (stored only as a hash) |

Until now, emails were only written to the server log (`ConsoleEmailSender`), so nobody outside the team could confirm an account or reset a password.

Services already depend on an `EmailSender` interface (`shared/email/EmailSender.ts`), not on a provider. So this decision only changes which `EmailSender` class `createDependencies.ts` creates. Services and tests don't change.

The server runs on Vercel as a serverless function. Any secret (API key, password) must come from the environment: `packages/server/.env` locally, the Vercel environment variables when deployed. Our rules ask for few libraries, simple code, and no ties to one vendor where we can avoid it.

## Options

| Criterion | Log only (`ConsoleEmailSender`) | Resend, with its `resend` package | **SMTP, with `nodemailer`** |
|---|---|---|---|
| Real emails reach users | No | Yes | Yes |
| Tied to one vendor | No | **Yes**: the code uses Resend's API | **No**: SMTP is a standard; any provider works |
| Needs our own domain | No | **Yes**: the sender domain must be verified in Resend (otherwise it only delivers to the account owner) | No: an existing email account (Gmail by default) can send |
| Secrets to manage | None | One API key | Email address and password (App Password for Gmail) |
| Free | Yes | Free tier | Yes (Gmail: about 500 emails a day) |
| Library | None | `resend` | `nodemailer` (widely used, maintained, has types) |

**Main con of Resend:** we would need to own a domain and verify it in Resend (DNS records). Without a verified domain, Resend only delivers to the Resend account owner's own address, so real users would never get the confirmation or password reset emails. We don't have a domain for the project, and buying and setting one up is extra cost and work.

## Decision

- Send emails over **SMTP** with **`nodemailer`**, in `shared/email/SmtpEmailSender.ts`. Only this file imports `nodemailer` (enforced by ESLint).
- The server logs in to an **email account**:
  - `EMAIL_USER`: the email address.
  - `EMAIL_PASS`: its password. For Gmail this is an **App Password**, never the account's normal password.
  - `EMAIL_FROM` (optional): the sender shown in the email. Defaults to `EMAIL_USER`.
  - `SMTP_HOST` / `SMTP_PORT` (optional): default to Gmail, `smtp.gmail.com` on port `465`.
- Port 465 uses an encrypted connection from the start, so the password never travels in plain text.
- Emails are sent as **plain text**, matching the `Email` interface.
- **Optional, unlike `DATABASE_URL`:** without `EMAIL_USER` and `EMAIL_PASS`, the server falls back to `ConsoleEmailSender`, so it still runs locally without the password. Setting only one of the two is a mistake, so the server stops at start-up with a clear message (fail fast).
- The connection, the server's greeting and each reply have a **5-second limit**, because sign-up waits for the email: a slow email server must not hang the request.
- A failed email (wrong password, server unreachable) is **logged, and the request does not fail**. The log never contains the email's text, because the text contains one-time tokens.

## Consequences

- ✅ Real confirmation and password reset emails reach users.
- ✅ Not tied to a vendor: moving to another provider (Resend over SMTP, Brevo, Outlook, ...) only changes `.env`, not the code.
- ✅ No domain to buy or verify.
- ✅ Services and their tests did not change, thanks to the `EmailSender` interface.
- ⚠️ One more library (`nodemailer`, plus `@types/nodemailer` for development).
- ⚠️ A Gmail account has a daily sending limit (about 500). That is enough for this project, but not for a real launch.
- ⚠️ Emails sent from a personal Gmail address are more likely to land in spam than emails from a verified domain.
- ⚠️ The App Password gives full sending access to that account. It must never be committed, and should be a team account, not someone's personal one.
- ⚠️ Because a failed email doesn't fail the request, a wrong password only shows in the `[server]` log. Check it if no email arrives.
