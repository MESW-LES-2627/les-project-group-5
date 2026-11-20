import type { SmtpConfig } from '../../config/env';
import type { Email, EmailSender } from './EmailSender';
import nodemailer, { type Transporter } from 'nodemailer';

// AccountService waits for the email before answering the request. nodemailer's own limits are minutes long,
// so a slow or unreachable email server would hang sign-up. A few seconds is plenty for a healthy server.
const TIMEOUT_MS = 5000;

/**
 * Sends each email for real (#52), logging in to an email account's SMTP server with the `nodemailer` package.
 * SMTP is a standard protocol, so any provider works (Gmail by default): only the values in .env change.
 * createDependencies.ts only uses it when EMAIL_USER and EMAIL_PASS are set; otherwise emails go to the log (ConsoleEmailSender).
 *
 * @param config SMTP server and login, read from .env by readConfig(). The password is never committed.
 */
export class SmtpEmailSender implements EmailSender {
  private readonly transporter: Transporter;

  constructor(private readonly config: SmtpConfig) {
    // One transporter per sender, created once at start-up and reused for every email.
    // Port 465 encrypts the connection from the start (secure: true), so the password never travels in plain text.
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS,
    });
  }

  async send(email: Email): Promise<void> {
    try {
      // nodemailer throws when the server refuses the email (wrong password, blocked sender, ...).
      const info = await this.transporter.sendMail({
        from: this.config.from,
        to: email.to,
        subject: email.subject,
        text: email.text,
      });

      // Only the id the email got, never its text: the text contains one-time tokens.
      console.log({ messageId: info.messageId });
    } catch (err) {
      // Refused emails and network problems: log them so the request itself does not fail.
      console.error(err);
    }
  }
}
