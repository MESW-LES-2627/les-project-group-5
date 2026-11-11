/**
 * Rules for a new password (US-E1-01, and later US-E1-07). Used by the pages and by the server.
 * Length is the only rule: long passwords are what makes guessing hard.
 */

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

/** What is wrong with a password, if anything. */
export type PasswordProblem = 'too-short' | 'too-long';

/** Returns the problem with the password, or null if it follows the rules. */
export function checkPassword(password: string): PasswordProblem | null {
  // Count characters as people see them: an emoji counts as 1, not as 2 (JavaScript's .length would say 2).
  const length = [...password].length;
  if (length < PASSWORD_MIN_LENGTH) return 'too-short';
  if (length > PASSWORD_MAX_LENGTH) return 'too-long';
  return null;
}
