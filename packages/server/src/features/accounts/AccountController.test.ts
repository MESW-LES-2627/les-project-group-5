import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app';
import { AccountEmails } from './AccountEmails';
import { AccountService } from './AccountService';
import { FakePasswordHasher, InMemoryAccountRepository, RecordingEmailSender } from './testDoubles';

const accounts = new InMemoryAccountRepository();
const emailSender = new RecordingEmailSender();
const app = buildApp({
  logger: false,
  database: { isOnline: async () => true },
  accounts: new AccountService(accounts, new FakePasswordHasher(), emailSender, new AccountEmails('https://app.example')),
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
