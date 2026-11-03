/**
 * Tells whether the database can be reached.
 * The health controller depends on this interface, not on Supabase, so tests can pass a fake.
 */
export interface DatabaseStatus {
  /** True if the database answers. Never throws: any failure just means "offline". */
  isOnline(): Promise<boolean>;
}
