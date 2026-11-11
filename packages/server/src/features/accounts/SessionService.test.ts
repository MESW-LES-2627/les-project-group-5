import { describe, expect, it } from 'vitest';
import type { PasswordHasher } from './PasswordHasher';
import { hashToken } from './SecretToken';
import { SessionService } from './SessionService';
import { FakePasswordHasher, InMemoryAccountRepository, InMemorySessionRepository } from './testDoubles';

const NOW = new Date('2026-11-11T10:00:00Z');
const PASSWORD = 'a long enough password';

/** A repository with one confirmed and one unconfirmed account. */
async function setUp(clock = { now: NOW }, passwords: PasswordHasher = new FakePasswordHasher()) {
  const accounts = new InMemoryAccountRepository();
  for (const email of ['ana@mail.com', 'new@mail.com']) {
    await accounts.createUnconfirmed({
      email,
      passwordHash: await passwords.hash(PASSWORD),
      confirmationTokenHash: `token-of-${email}`,
      confirmationExpiresAt: NOW,
    });
  }
  accounts.accounts[0].emailConfirmedAt = NOW;
  const sessions = new InMemorySessionRepository(accounts);
  return { sessions, service: new SessionService(sessions, passwords, () => clock.now) };
}

describe('SessionService.logIn', () => {
  it('starts a session for a confirmed account with the right password', async () => {
    const { sessions, service } = await setUp();
    const result = await service.logIn(' Ana@Mail.com ', PASSWORD);
    expect(result.outcome).toBe('logged-in');
    if (result.outcome !== 'logged-in') return;
    expect(result.email).toBe('ana@mail.com');
    // Only the hash of the token is stored.
    expect(sessions.sessions.has(hashToken(result.token))).toBe(true);
    expect(sessions.sessions.has(result.token)).toBe(false);
  });

  it('makes the session last 30 days', async () => {
    const { service } = await setUp();
    const result = await service.logIn('ana@mail.com', PASSWORD);
    expect(result.outcome === 'logged-in' && result.expiresAt).toEqual(new Date('2026-12-11T10:00:00Z'));
  });

  it('gives the same answer for a wrong password and for an email with no account', async () => {
    const { sessions, service } = await setUp();
    expect(await service.logIn('ana@mail.com', 'wrong password!!')).toEqual({ outcome: 'invalid' });
    expect(await service.logIn('nobody@mail.com', PASSWORD)).toEqual({ outcome: 'invalid' });
    expect(sessions.sessions.size).toBe(0);
  });

  it('checks a password even when the email has no account, so both answers take as long', async () => {
    const checked: string[] = [];
    const counting: PasswordHasher = {
      hash: async (password) => `hashed:${password}`,
      verify: async (password, stored) => {
        checked.push(stored);
        return stored === `hashed:${password}`;
      },
    };
    const { service } = await setUp({ now: NOW }, counting);
    await service.logIn('nobody@mail.com', PASSWORD);
    expect(checked).toHaveLength(1);
  });

  it('says "not confirmed" for an unconfirmed account with the right password, and starts no session', async () => {
    const { sessions, service } = await setUp();
    expect(await service.logIn('new@mail.com', PASSWORD)).toEqual({ outcome: 'not-confirmed' });
    expect(sessions.sessions.size).toBe(0);
  });

  it('says "invalid" for an unconfirmed account with a wrong password', async () => {
    const { service } = await setUp();
    expect(await service.logIn('new@mail.com', 'wrong password!!')).toEqual({ outcome: 'invalid' });
  });
});

describe('SessionService.currentUser and logOut', () => {
  async function loggedIn(clock = { now: NOW }) {
    const setup = await setUp(clock);
    const result = await setup.service.logIn('ana@mail.com', PASSWORD);
    if (result.outcome !== 'logged-in') throw new Error('login failed');
    return { ...setup, token: result.token };
  }

  it('finds the user of a valid session', async () => {
    const { service, token } = await loggedIn();
    expect((await service.currentUser(token))?.email).toBe('ana@mail.com');
  });

  it('finds nobody without a token, with a malformed token or after 30 days', async () => {
    const clock = { now: NOW };
    const { service, token } = await loggedIn(clock);
    expect(await service.currentUser(undefined)).toBeNull();
    expect(await service.currentUser('nope')).toBeNull();
    clock.now = new Date('2026-12-11T10:00:00Z');
    expect(await service.currentUser(token)).toBeNull();
  });

  it('ends only the session that logs out', async () => {
    const { service, token } = await loggedIn();
    const other = await service.logIn('ana@mail.com', PASSWORD);
    if (other.outcome !== 'logged-in') throw new Error('login failed');

    await service.logOut(token);
    expect(await service.currentUser(token)).toBeNull();
    expect((await service.currentUser(other.token))?.email).toBe('ana@mail.com');
  });
});
