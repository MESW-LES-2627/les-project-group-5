import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app';
import { AccountEmails } from './AccountEmails';
import { AccountService } from './AccountService';
import { SessionService } from './SessionService';
import { FakePasswordHasher, InMemoryAccountRepository, InMemorySessionRepository, RecordingEmailSender } from './testDoubles';

const accounts = new InMemoryAccountRepository();
const emailSender = new RecordingEmailSender();
const app = buildApp({
  logger: false,
  database: { isOnline: async () => true },
  accounts: new AccountService(
    accounts,
    new FakePasswordHasher(),
    emailSender,
    new AccountEmails('https://app.example'),
    () => new Date(),
    // No real waiting for the minimum duration of a resend.
    async () => {},
  ),
  sessions: new SessionService(new InMemorySessionRepository(accounts), new FakePasswordHasher()),
  secureCookies: false,
});
afterAll(() => app.close());

function signUp(body: unknown) {
  return app.inject({ method: 'POST', url: '/api/accounts', payload: body as object });
}

describe('POST /api/accounts', () => {
  it('answers 202 for a new email', async () => {
    const response = await signUp({ email: 'new@mail.com', password: 'a long enough password' });
    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ status: 'check-your-email' });
  });

  it('answers exactly the same for an email that already has an account', async () => {
    await signUp({ email: 'taken@mail.com', password: 'a long enough password' });
    const first = await signUp({ email: 'other@mail.com', password: 'a long enough password' });
    const again = await signUp({ email: 'taken@mail.com', password: 'a long enough password' });
    expect(again.statusCode).toBe(first.statusCode);
    expect(again.body).toBe(first.body);
  });

  it('answers 400 with the rejected fields', async () => {
    const response = await signUp({ email: 'not-an-email', password: 'short' });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ errors: { email: 'invalid-format', password: 'too-short' } });
  });

  it('answers 400 when a field is missing', async () => {
    const response = await signUp({ email: 'ana@mail.com' });
    expect(response.statusCode).toBe(400);
  });

  it('never sends the password back', async () => {
    const response = await signUp({ email: 'x', password: 'my secret password!' });
    expect(response.body).not.toContain('my secret password!');
  });

  it('rejects a huge body before hashing it', async () => {
    const response = await signUp({ email: 'ana@mail.com', password: 'a'.repeat(5000) });
    expect(response.statusCode).toBe(400);
    expect(accounts.accounts.some((account) => account.email === 'ana@mail.com')).toBe(false);
  });
});

describe('POST /api/email-confirmations', () => {
  /** Signs up and returns the token from the last confirmation email. */
  async function newToken(email: string): Promise<string> {
    await signUp({ email, password: 'a long enough password' });
    const text = emailSender.sent.at(-1)?.text ?? '';
    return /token=([\w-]+)/.exec(text)?.[1] ?? '';
  }

  function confirm(body: unknown) {
    return app.inject({ method: 'POST', url: '/api/email-confirmations', payload: body as object });
  }

  it('answers 200 "confirmed" for a valid token', async () => {
    const response = await confirm({ token: await newToken('confirm@mail.com') });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'confirmed' });
  });

  it('answers 400 "invalid" when the same token is used again', async () => {
    const token = await newToken('twice@mail.com');
    await confirm({ token });
    const again = await confirm({ token });
    expect(again.statusCode).toBe(400);
    expect(again.json()).toEqual({ status: 'invalid' });
  });

  it('answers 400 "invalid" for a malformed token', async () => {
    const response = await confirm({ token: 'nope' });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ status: 'invalid' });
  });

  it('answers 400 when the token is missing', async () => {
    expect((await confirm({})).statusCode).toBe(400);
  });
});

describe('POST /api/confirmation-emails', () => {
  function resend(body: unknown) {
    return app.inject({ method: 'POST', url: '/api/confirmation-emails', payload: body as object });
  }

  it('answers the same 202 for an unconfirmed account and for no account', async () => {
    await signUp({ email: 'resend@mail.com', password: 'a long enough password' });
    const before = emailSender.sent.length;
    const unconfirmed = await resend({ email: 'resend@mail.com' });
    // The sign-up email was just sent, so this one is inside the one-minute limit: nothing is sent.
    expect(emailSender.sent.length).toBe(before);
    const unknown = await resend({ email: 'nobody-here@mail.com' });
    for (const response of [unconfirmed, unknown]) {
      expect(response.statusCode).toBe(202);
      expect(response.json()).toEqual({ status: 'check-your-email' });
    }
  });

  it('answers 400 for a malformed email', async () => {
    const response = await resend({ email: 'not-an-email' });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ errors: { email: 'invalid-format' } });
  });

  it('answers 400 when the email is missing', async () => {
    expect((await resend({})).statusCode).toBe(400);
  });
});

describe('POST /api/password-reset-emails', () => {
  function requestReset(body: unknown) {
    return app.inject({ method: 'POST', url: '/api/password-reset-emails', payload: body as object });
  }

  it('answers the same 202 for an existing account and an unknown email', async () => {
    await signUp({ email: 'reset-request@mail.com', password: 'a long enough password' });
    const existing = await requestReset({ email: 'reset-request@mail.com' });
    const sentAfterExisting = emailSender.sent.length;
    const unknown = await requestReset({ email: 'nobody-reset@mail.com' });

    for (const response of [existing, unknown]) {
      expect(response.statusCode).toBe(202);
      expect(response.json()).toEqual({ status: 'check-your-email' });
    }
    expect(sentAfterExisting).toBe(emailSender.sent.length);
    expect(emailSender.sent.at(-1)?.subject).toBe('Reset your password');
  });

  it('answers 202 for an invalid email without sending anything', async () => {
    const before = emailSender.sent.length;
    const response = await requestReset({ email: 'not-an-email' });
    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ status: 'check-your-email' });
    expect(emailSender.sent).toHaveLength(before);
  });

  it('answers 400 when the email is missing', async () => {
    expect((await requestReset({})).statusCode).toBe(400);
  });
});
