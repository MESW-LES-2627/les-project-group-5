import { describe, expect, it } from 'vitest';
import { ScryptPasswordHasher } from './ScryptPasswordHasher';

const hasher = new ScryptPasswordHasher();
const PASSWORD = 'correct horse battery staple';

describe('ScryptPasswordHasher', () => {
  it('verifies the password it hashed', async () => {
    const hash = await hasher.hash(PASSWORD);
    expect(await hasher.verify(PASSWORD, hash)).toBe(true);
  });

  it('rejects a different password', async () => {
    const hash = await hasher.hash(PASSWORD);
    expect(await hasher.verify('correct horse battery stapler', hash)).toBe(false);
  });

  it('never contains the password itself', async () => {
    expect(await hasher.hash(PASSWORD)).not.toContain(PASSWORD);
  });

  it('gives different hashes for the same password (random salt)', async () => {
    expect(await hasher.hash(PASSWORD)).not.toBe(await hasher.hash(PASSWORD));
  });

  it('rejects a stored value that is not one of our hashes', async () => {
    expect(await hasher.verify(PASSWORD, 'not-a-hash')).toBe(false);
  });
});
