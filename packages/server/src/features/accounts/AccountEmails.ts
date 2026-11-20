import type { Email } from '../../shared/email/EmailSender';

/**
 * The text of the emails about accounts. Links use the app's base address from the configuration,
 * never the address the request came from, which an attacker could fake to steal the token.
 * The token goes after the "#", a part of the address that browsers never send to the server.
 */
export class AccountEmails {
  constructor(private readonly appBaseUrl: string) {}

  /** Sent after sign-up, to prove the person owns the email (US-E1-01, US-E1-02). */
  confirmation(to: string, token: string): Email {
    return {
      to,
      subject: 'Confirm your email',
      text: [
        'Welcome to the Web-based Gesture Instrument!',
        '',
        'Open this link to confirm your email and activate your account:',
        `${this.appBaseUrl}/#/confirm-email?token=${token}`,
        '',
        'The link works once and expires in 24 hours.',
        "If you didn't create an account, you can ignore this email.",
      ].join('\n'),
    };
  }

  /**
   * Sent instead of a confirmation when the email already has an account (US-E1-01).
   * The person who signed up sees the same message either way, so they can't tell that the account exists;
   * only the owner of the email learns about it.
   */
  signUpAttempt(to: string): Email {
    return {
      to,
      subject: 'Someone tried to sign up with your email',
      text: [
        'Someone tried to create an account with this email, but you already have one.',
        '',
        `If it was you, log in here: ${this.appBaseUrl}/#/login`,
        `If you forgot your password, reset it here: ${this.appBaseUrl}/#/forgot-password`,
        '',
        "If it wasn't you, you can ignore this email. Your account has not changed.",
      ].join('\n'),
    };
  }
}
