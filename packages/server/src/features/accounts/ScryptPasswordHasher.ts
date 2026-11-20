import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import type { PasswordHasher } from './PasswordHasher';

// scrypt is built into Node, so we need no extra library. It is slow on purpose and needs a lot of memory,
// which makes guessing passwords from a stolen database very expensive.
// Cost 2^16 with block size 8 uses 64 MB and takes around a tenth of a second per hash.
const COST_LOG2 = 16;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
// Node refuses to use more than 32 MB unless we allow it.
const MAX_MEMORY = 128 * 1024 * 1024;

/**
 * Hashes passwords with scrypt and a random salt per password.
 * Stored format: scrypt$<cost log2>$<block size>$<parallelization>$<salt>$<hash> (salt and hash in base64).
 * The parameters are stored with each hash, so we can make them stronger later and old hashes still verify.
 */
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    // A random salt makes two equal passwords give different hashes.
    const salt = randomBytes(SALT_LENGTH);
    const key = await deriveKey(password, salt, KEY_LENGTH, {
      N: 2 ** COST_LOG2,
      r: BLOCK_SIZE,
      p: PARALLELIZATION,
      maxmem: MAX_MEMORY,
    });
    return ['scrypt', COST_LOG2, BLOCK_SIZE, PARALLELIZATION, salt.toString('base64'), key.toString('base64')].join('$');
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, costLog2, blockSize, parallelization, salt, key] = storedHash.split('$');
    if (algorithm !== 'scrypt' || !salt || !key) return false;
    const expected = Buffer.from(key, 'base64');
    try {
      const actual = await deriveKey(password, Buffer.from(salt, 'base64'), expected.length, {
        N: 2 ** Number(costLog2),
        r: Number(blockSize),
        p: Number(parallelization),
        maxmem: MAX_MEMORY,
      });
      // Compares in constant time, so the time taken doesn't tell how much of the hash matched.
      return timingSafeEqual(actual, expected);
    } catch {
      // Broken parameters in the stored value: it can't match any password.
      return false;
    }
  }
}

/** Node's scrypt takes a callback; this wraps it in a promise. */
function deriveKey(password: string, salt: Buffer, length: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, length, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}
