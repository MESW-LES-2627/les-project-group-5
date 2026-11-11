import { describe, expect, it } from 'vitest';
import { AccountEmails } from './AccountEmails';
import { AccountService } from './AccountService';
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
