import { describe, expect, it } from 'vitest';
import { AccountEmails } from './AccountEmails';
import { AccountService, RESEND_MIN_DURATION_MS } from './AccountService';
import { hashToken } from './SecretToken';
import { FakePasswordHasher, InMemoryAccountRepository, RecordingEmailSender } from './testDoubles';

const NOW = new Date('2026-11-11T10:00:00Z');
const PASSWORD = 'a long enough password';

function setUp() {
  const accounts = new InMemoryAccountRepository();
  const emailSender = new RecordingEmailSender();
  const service = new AccountService(
    accounts,
    new FakePasswordHasher(),
    emailSender,
    new AccountEmails('https://app.example'),
    () => NOW,
  );
  return { accounts, emailSender, service };
}

/** The token in the confirmation link of an email. */
function tokenIn(text: string): string {
  const match = /#\/confirm-email\?token=([\w-]+)/.exec(text);
  if (!match) throw new Error('No confirmation link in the email');
  return match[1];
}

describe('AccountService.signUp', () => {
  describe('with a new email', () => {
    it('creates an unconfirmed account with the normalized email and only the password hash', async () => {
      const { accounts, service } = setUp();
      expect(await service.signUp('  Ana@Mail.com ', PASSWORD)).toEqual({ outcome: 'accepted' });
      expect(accounts.accounts).toHaveLength(1);
      expect(accounts.accounts[0].email).toBe('ana@mail.com');
      expect(accounts.accounts[0].passwordHash).toBe(`hashed:${PASSWORD}`);
    });

    it('sends a confirmation link whose token is stored only as a hash', async () => {
      const { accounts, emailSender, service } = setUp();
      await service.signUp('ana@mail.com', PASSWORD);

      expect(emailSender.sent).toHaveLength(1);
      const email = emailSender.sent[0];
      expect(email.to).toBe('ana@mail.com');
      expect(email.text).toContain('https://app.example/#/confirm-email?token=');
      const token = tokenIn(email.text);
      expect(accounts.accounts[0].confirmationTokenHash).toBe(hashToken(token));
      expect(accounts.accounts[0].confirmationTokenHash).not.toBe(token);
    });

    it('makes the confirmation link expire 24 hours later', async () => {
      const { accounts, service } = setUp();
      await service.signUp('ana@mail.com', PASSWORD);
      expect(accounts.accounts[0].confirmationExpiresAt).toEqual(new Date('2026-11-12T10:00:00Z'));
    });
  });

  describe('with an email that already has an account', () => {
    it('answers exactly as for a new email, creates nothing and warns the owner', async () => {
      const { accounts, emailSender, service } = setUp();
      await service.signUp('ana@mail.com', PASSWORD);

      // A different spelling of the same email, as an attacker might try.
      expect(await service.signUp('ANA@mail.com', 'another long password')).toEqual({ outcome: 'accepted' });

      expect(accounts.accounts).toHaveLength(1);
      expect(emailSender.sent).toHaveLength(2);
      const warning = emailSender.sent[1];
      expect(warning.to).toBe('ana@mail.com');
      expect(warning.subject).toBe('Someone tried to sign up with your email');
      expect(warning.text).toContain('https://app.example/#/login');
      expect(warning.text).toContain('https://app.example/#/forgot-password');
      expect(warning.text).not.toContain('confirm-email');
    });
  });

  describe('with invalid input', () => {
    it('rejects an email with an invalid format and sends nothing', async () => {
      const { accounts, emailSender, service } = setUp();
      expect(await service.signUp('ana.mail.com', PASSWORD)).toEqual({
        outcome: 'rejected',
        errors: { email: 'invalid-format' },
      });
      expect(accounts.accounts).toHaveLength(0);
      expect(emailSender.sent).toHaveLength(0);
    });

    it('rejects a password shorter than 12 characters', async () => {
      const { service } = setUp();
      expect(await service.signUp('ana@mail.com', 'short')).toEqual({
        outcome: 'rejected',
        errors: { password: 'too-short' },
      });
    });

    it('rejects a password longer than 128 characters', async () => {
      const { service } = setUp();
      expect(await service.signUp('ana@mail.com', 'a'.repeat(129))).toEqual({
        outcome: 'rejected',
        errors: { password: 'too-long' },
      });
    });

    it('reports both fields at once', async () => {
      const { service } = setUp();
      expect(await service.signUp('nope', 'short')).toEqual({
        outcome: 'rejected',
        errors: { email: 'invalid-format', password: 'too-short' },
      });
    });
  });
});

describe('AccountService.confirmEmail', () => {
  /** Signs up at NOW and returns the token from the confirmation email. */
  async function signedUp(clock: { now: Date }) {
    const accounts = new InMemoryAccountRepository();
    const emailSender = new RecordingEmailSender();
    const service = new AccountService(
      accounts,
      new FakePasswordHasher(),
      emailSender,
      new AccountEmails('https://app.example'),
      () => clock.now,
    );
    await service.signUp('ana@mail.com', PASSWORD);
    return { accounts, service, token: tokenIn(emailSender.sent[0].text) };
  }

  it('confirms the account with a valid link', async () => {
    const clock = { now: NOW };
    const { accounts, service, token } = await signedUp(clock);
    clock.now = new Date('2026-11-11T12:00:00Z');
    expect(await service.confirmEmail(token)).toBe('confirmed');
    expect(accounts.accounts[0].emailConfirmedAt).toEqual(clock.now);
  });

  it('works only once', async () => {
    const { service, token } = await signedUp({ now: NOW });
    await service.confirmEmail(token);
    expect(await service.confirmEmail(token)).toBe('invalid');
  });

  it('still works one second before 24 hours', async () => {
    const clock = { now: NOW };
    const { service, token } = await signedUp(clock);
    clock.now = new Date('2026-11-12T09:59:59Z');
    expect(await service.confirmEmail(token)).toBe('confirmed');
  });

  it('says "expired" after 24 hours, and does not confirm', async () => {
    const clock = { now: NOW };
    const { accounts, service, token } = await signedUp(clock);
    clock.now = new Date('2026-11-12T10:00:00Z');
    expect(await service.confirmEmail(token)).toBe('expired');
    expect(accounts.accounts[0].emailConfirmedAt).toBeNull();
  });

  it('keeps saying "expired" for an expired link (it is not deleted)', async () => {
    const clock = { now: NOW };
    const { service, token } = await signedUp(clock);
    clock.now = new Date('2026-11-13T10:00:00Z');
    await service.confirmEmail(token);
    expect(await service.confirmEmail(token)).toBe('expired');
  });

  it('says "invalid" for an unknown token', async () => {
    const { service } = await signedUp({ now: NOW });
    expect(await service.confirmEmail('A'.repeat(43))).toBe('invalid');
  });

  it.each(['', 'short', 'a'.repeat(44), `${'a'.repeat(42)}!`])('says "invalid" for the malformed token "%s"', async (token) => {
    const { service } = await signedUp({ now: NOW });
    expect(await service.confirmEmail(token)).toBe('invalid');
  });
});

describe('AccountService.resendConfirmation', () => {
  /** A service with one unconfirmed account (ana) and one confirmed account (bia), both signed up at NOW. */
  async function setUpResend() {
    const clock = { now: NOW };
    const waits: number[] = [];
    const accounts = new InMemoryAccountRepository();
    const emailSender = new RecordingEmailSender();
    const service = new AccountService(
      accounts,
      new FakePasswordHasher(),
      emailSender,
      new AccountEmails('https://app.example'),
      () => clock.now,
      async (ms) => {
        waits.push(ms);
      },
    );
    await service.signUp('ana@mail.com', PASSWORD);
    await service.signUp('bia@mail.com', PASSWORD);
    await service.confirmEmail(tokenIn(emailSender.sent[1].text));
    const firstLink = tokenIn(emailSender.sent[0].text);
    emailSender.sent.length = 0;
    return { clock, waits, emailSender, service, firstLink };
  }

  it('sends a new link to an unconfirmed account, and the old link stops working', async () => {
    const { clock, emailSender, service, firstLink } = await setUpResend();
    clock.now = new Date('2026-11-11T10:05:00Z');
    expect(await service.resendConfirmation(' Ana@Mail.com ')).toBe('accepted');

    expect(emailSender.sent).toHaveLength(1);
    expect(emailSender.sent[0].to).toBe('ana@mail.com');
    const newLink = tokenIn(emailSender.sent[0].text);
    expect(await service.confirmEmail(firstLink)).toBe('invalid');
    expect(await service.confirmEmail(newLink)).toBe('confirmed');
  });

  it('gives the new link 24 hours from the moment it is sent', async () => {
    const { clock, emailSender, service } = await setUpResend();
    clock.now = new Date('2026-11-11T10:05:00Z');
    await service.resendConfirmation('ana@mail.com');
    const newLink = tokenIn(emailSender.sent[0].text);
    clock.now = new Date('2026-11-12T10:04:59Z');
    expect(await service.confirmEmail(newLink)).toBe('confirmed');
  });

  it('works for an account whose first link already expired', async () => {
    const { clock, emailSender, service } = await setUpResend();
    clock.now = new Date('2026-11-13T10:00:00Z');
    await service.resendConfirmation('ana@mail.com');
    expect(emailSender.sent).toHaveLength(1);
  });

  it.each(['bia@mail.com', 'nobody@mail.com'])(
    'sends nothing to %s (confirmed or no account), with the same answer',
    async (email) => {
      const { clock, emailSender, service } = await setUpResend();
      clock.now = new Date('2026-11-11T10:05:00Z');
      expect(await service.resendConfirmation(email)).toBe('accepted');
      expect(emailSender.sent).toHaveLength(0);
    },
  );

  it('sends at most one email per minute, counting the sign-up email', async () => {
    const { clock, emailSender, service, firstLink } = await setUpResend();
    // 59 seconds after sign-up: too soon, nothing changes and the first link still works.
    clock.now = new Date('2026-11-11T10:00:59Z');
    expect(await service.resendConfirmation('ana@mail.com')).toBe('accepted');
    expect(emailSender.sent).toHaveLength(0);

    clock.now = new Date('2026-11-11T10:01:00Z');
    await service.resendConfirmation('ana@mail.com');
    expect(emailSender.sent).toHaveLength(1);

    clock.now = new Date('2026-11-11T10:01:30Z');
    await service.resendConfirmation('ana@mail.com');
    expect(emailSender.sent).toHaveLength(1);
    expect(await service.confirmEmail(firstLink)).toBe('invalid');
  });

  it('always takes at least 3 seconds, whether or not an email was sent', async () => {
    const { clock, waits, service } = await setUpResend();
    clock.now = new Date('2026-11-11T10:05:00Z');
    await service.resendConfirmation('ana@mail.com');
    await service.resendConfirmation('nobody@mail.com');
    expect(waits).toEqual([RESEND_MIN_DURATION_MS, RESEND_MIN_DURATION_MS]);
  });

  it('waits only for the time left when sending already took a while', async () => {
    const { clock, waits, emailSender, service } = await setUpResend();
    clock.now = new Date('2026-11-11T10:05:00Z');
    // A slow email server: sending takes 2 seconds on the clock.
    emailSender.send = async () => {
      clock.now = new Date('2026-11-11T10:05:02Z');
    };
    await service.resendConfirmation('ana@mail.com');
    expect(waits).toEqual([1000]);
  });

  it('rejects a malformed email without waiting, since it reveals nothing', async () => {
    const { waits, emailSender, service } = await setUpResend();
    expect(await service.resendConfirmation('not-an-email')).toBe('invalid-email');
    expect(emailSender.sent).toHaveLength(0);
    expect(waits).toEqual([]);
  });
});
