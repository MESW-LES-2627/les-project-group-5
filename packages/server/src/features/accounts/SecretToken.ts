import { createHash, randomBytes } from 'node:crypto';

/** A one-time secret for a link or a session: the token goes to the user, only its hash is stored. */
export interface SecretToken {
  /** Goes into the link or the cookie. Never stored. */
  token: string;
  /** Goes into the database. */
  hash: string;
}

/** 32 random bytes: far too many possibilities to guess. */
const TOKEN_BYTES = 32;

/** Creates a new random token and its hash. */
export function createSecretToken(): SecretToken {
  // base64url uses only characters that are safe in a link.
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  return { token, hash: hashToken(token) };
}

/**
 * The hash stored for a token. SHA-256 is enough here (no slow hash like for passwords):
 * the token is random and long, so there is nothing to guess.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** True if the text looks like a token we create (43 base64url characters), so we don't search for anything else. */
export function isWellFormedToken(text: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(text);
}
