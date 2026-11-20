import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app';
import { AccountEmails } from './AccountEmails';
import { AccountService } from './AccountService';
import { SessionService } from './SessionService';
import { FakePasswordHasher, InMemoryAccountRepository, InMemorySessionRepository, RecordingEmailSender } from './testDoubles';

const PASSWORD = 'a long enough password';

async function appWithAccounts(secureCookies: boolean) {
  const accounts = new InMemoryAccountRepository();
  const passwords = new FakePasswordHasher();
  for (const email of ['ana@mail.com', 'new@mail.com']) {
    await accounts.createUnconfirmed({
      email,
      passwordHash: await passwords.hash(PASSWORD),
      confirmationTokenHash: `token-of-${email}`,
      confirmationExpiresAt: new Date(),
    });
  }
  accounts.accounts[0].emailConfirmedAt = new Date();
  return buildApp({
    logger: false,
    database: { isOnline: async () => true },
    accounts: new AccountService(accounts, passwords, new RecordingEmailSender(), new AccountEmails('https://app.example')),
    sessions: new SessionService(new InMemorySessionRepository(accounts), passwords),
    secureCookies,
  });
}

const app = await appWithAccounts(false);
const secureApp = await appWithAccounts(true);
afterAll(async () => {
  await app.close();
  await secureApp.close();
});

function logIn(email: string, password: string) {
  return app.inject({ method: 'POST', url: '/api/sessions', payload: { email, password } });
}

/** The value of the session cookie set by a response. */
function sessionCookie(response: Awaited<ReturnType<typeof logIn>>) {
  return response.cookies.find((cookie) => cookie.name === 'session');
}

describe('POST /api/sessions', () => {
  it('answers 200 and sets an HttpOnly session cookie for the API only', async () => {
    const response = await logIn('ana@mail.com', PASSWORD);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ email: 'ana@mail.com' });
    const cookie = sessionCookie(response);
    expect(cookie?.value).toBeTruthy();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('Lax');
    expect(cookie?.path).toBe('/api');
  });

  it('marks the cookie Secure when the app runs on https', async () => {
    const response = await secureApp.inject({
      method: 'POST',
      url: '/api/sessions',
      payload: { email: 'ana@mail.com', password: PASSWORD },
    });
    expect(sessionCookie(response)?.secure).toBe(true);
  });

  it('answers exactly the same for a wrong password and for an email with no account', async () => {
    const wrongPassword = await logIn('ana@mail.com', 'wrong password!!');
    const noAccount = await logIn('nobody@mail.com', PASSWORD);
    expect(wrongPassword.statusCode).toBe(401);
    expect(noAccount.statusCode).toBe(401);
    expect(noAccount.body).toBe(wrongPassword.body);
    expect(sessionCookie(wrongPassword)).toBeUndefined();
  });

  it('answers 403 for an unconfirmed account with the right password, without a cookie', async () => {
    const response = await logIn('new@mail.com', PASSWORD);
    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'email-not-confirmed' });
    expect(sessionCookie(response)).toBeUndefined();
  });
});

describe('GET and DELETE /api/session', () => {
  async function loggedInCookie(): Promise<string> {
    return sessionCookie(await logIn('ana@mail.com', PASSWORD))?.value ?? '';
  }

  function whoAmI(token?: string) {
    return app.inject({ method: 'GET', url: '/api/session', cookies: token ? { session: token } : {} });
  }

  it('answers 200 with the email while logged in', async () => {
    const response = await whoAmI(await loggedInCookie());
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ email: 'ana@mail.com' });
  });

  it('answers 401 without a session', async () => {
    expect((await whoAmI()).statusCode).toBe(401);
  });

  it('logs out: 204, clears the cookie, and the old cookie then gets 401', async () => {
    const token = await loggedInCookie();
    const response = await app.inject({ method: 'DELETE', url: '/api/session', cookies: { session: token } });
    expect(response.statusCode).toBe(204);
    const cleared = sessionCookie(response);
    expect(cleared?.value).toBe('');
    expect(cleared?.expires?.getTime()).toBeLessThanOrEqual(Date.now());
    // An old copy of the cookie no longer gives access (US-E1-05).
    expect((await whoAmI(token)).statusCode).toBe(401);
  });

  it('logging out on one device keeps the other device logged in', async () => {
    const phone = await loggedInCookie();
    const laptop = await loggedInCookie();
    await app.inject({ method: 'DELETE', url: '/api/session', cookies: { session: phone } });
    expect((await whoAmI(laptop)).statusCode).toBe(200);
  });
});
