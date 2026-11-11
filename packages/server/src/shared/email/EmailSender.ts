/** One email to send: plain text only. */
export interface Email {
  to: string;
  subject: string;
  text: string;
}

/**
 * Sends emails. Services depend on this interface, not on an email provider,
 * so the provider can be chosen later (#52) without changing them, and tests can use a fake.
 */
export interface EmailSender {
  send(email: Email): Promise<void>;
}
