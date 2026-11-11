import type { Email, EmailSender } from './EmailSender';

/**
 * Writes each email to the server log instead of sending it.
 * We use it until a real email provider is set up (#52). On Vercel the log is only visible to the
 * project's members, so the links in it (which contain one-time tokens) are not public.
 */
export class ConsoleEmailSender implements EmailSender {
  constructor(private readonly write: (line: string) => void = console.info) {}

  async send(email: Email): Promise<void> {
    this.write(`[email] To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}`);
  }
}
