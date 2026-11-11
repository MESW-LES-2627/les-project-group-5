/**
 * Turns a password into a hash that can be stored, and checks a password against a stored hash.
 * The service depends on this interface, so its tests can use a fast fake instead of the slow real hash.
 */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  /** True if the password matches the stored hash. */
  verify(password: string, storedHash: string): Promise<boolean>;
}
