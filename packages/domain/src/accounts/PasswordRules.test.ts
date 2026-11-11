import { describe, expect, it } from 'vitest';
import { checkPassword } from './PasswordRules';

describe('checkPassword', () => {
  it('accepts 12 characters (the minimum)', () => {
    expect(checkPassword('a'.repeat(12))).toBeNull();
  });

  it('accepts 128 characters (the maximum)', () => {
    expect(checkPassword('a'.repeat(128))).toBeNull();
  });

  it('rejects 11 characters as too short', () => {
    expect(checkPassword('a'.repeat(11))).toBe('too-short');
  });

  it('rejects 129 characters as too long', () => {
    expect(checkPassword('a'.repeat(129))).toBe('too-long');
  });

  it('counts an emoji as one character', () => {
    // 11 letters + 1 emoji = 12 characters, although JavaScript's .length says 13.
    expect(checkPassword(`${'a'.repeat(11)}🎵`)).toBeNull();
    expect(checkPassword(`${'a'.repeat(10)}🎵`)).toBe('too-short');
  });
});
