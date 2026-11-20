/**
 * Rules for the email of an account (US-E1-01). Used by the sign-up page, to show a field error right away,
 * and by the server, which checks again because the browser can't be trusted.
 */

/** The longest email address that mail servers accept. */
const MAX_EMAIL_LENGTH = 254;

/**
 * Something@something.something, with no spaces, using only plain (ASCII) characters.
 * It is deliberately simple: the confirmation email is the real test that an address works.
 * ASCII only, so that lower-casing gives the same result here and in the database.
 */
const EMAIL_FORMAT = /^[\x21-\x7E]+@[\x21-\x7E]+\.[\x21-\x7E]+$/;

/**
 * The form in which emails are stored and compared: no surrounding spaces, lower case.
 * So "Ana@Mail.com " and "ana@mail.com" are the same account.
 */
export function normalizeEmail(text: string): string {
  return text.trim().toLowerCase();
}

/** True if the (normalized) email has a valid format. */
export function isValidEmail(email: string): boolean {
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_FORMAT.test(email) && email.split('@').length === 2;
}
