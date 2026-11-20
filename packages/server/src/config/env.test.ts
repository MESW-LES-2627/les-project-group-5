import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSmtpConfig } from './env';

// Clear every SMTP variable first, so a real packages/server/.env cannot change the results.
function setEnv(values: { EMAIL_USER?: string; EMAIL_PASS?: string }): void {
  for (const name of ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM', 'SMTP_HOST', 'SMTP_PORT']) vi.stubEnv(name, '');
  for (const [name, value] of Object.entries(values)) vi.stubEnv(name, value);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('readSmtpConfig', () => {
  it('returns undefined when neither EMAIL_USER nor EMAIL_PASS is set (emails only go to the log)', () => {
    setEnv({});
    expect(readSmtpConfig()).toBeUndefined();
  });

  it('fails when only EMAIL_USER is set', () => {
    setEnv({ EMAIL_USER: 'me@gmail.com' });
    expect(() => readSmtpConfig()).toThrow('Missing EMAIL_PASS');
  });

  it('fails when only EMAIL_PASS is set', () => {
    setEnv({ EMAIL_PASS: 'app-password' });
    expect(() => readSmtpConfig()).toThrow('Missing EMAIL_USER');
  });

  it('uses Gmail defaults when both are set', () => {
    setEnv({ EMAIL_USER: 'me@gmail.com', EMAIL_PASS: 'app-password' });
    expect(readSmtpConfig()).toEqual({
      host: 'smtp.gmail.com',
      port: 465,
      user: 'me@gmail.com',
      pass: 'app-password',
      from: 'me@gmail.com',
    });
  });
});
