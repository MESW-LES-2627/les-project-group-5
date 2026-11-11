import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail } from './EmailAddress';

describe('normalizeEmail', () => {
  it('removes surrounding spaces and uses lower case', () => {
    expect(normalizeEmail('  Ana@Mail.COM ')).toBe('ana@mail.com');
  });

  it('makes two spellings of the same email equal', () => {
    expect(normalizeEmail('Ana@Mail.com ')).toBe(normalizeEmail('ana@mail.com'));
  });
});

describe('isValidEmail', () => {
  it.each(['ana@mail.com', 'ana.silva+music@fe.up.pt', 'a@b.co'])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    ['an empty text', ''],
    ['no @', 'ana.mail.com'],
    ['two @', 'ana@silva@mail.com'],
    ['no dot after the @', 'ana@mail'],
    ['a space inside', 'ana silva@mail.com'],
    ['nothing before the @', '@mail.com'],
    ['non-ASCII characters', 'ana@mãil.com'],
  ])('rejects %s', (_case, email) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it('rejects an email longer than 254 characters', () => {
    expect(isValidEmail(`${'a'.repeat(250)}@mail.com`)).toBe(false);
  });
});
