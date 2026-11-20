-- 001: accounts, email confirmation, password reset, sessions and login attempts.
-- Run by hand, in number order: staging first, then production (see docs/adr/001-database-choice.md).
-- Never edit this file after it has been run; add a new numbered file instead.

-- One row per account.
CREATE TABLE users (
  -- A random id, so nobody can guess other users' ids by counting (US-E2-05).
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stored already normalized: lower case, no surrounding spaces (US-E1-01).
  -- The check makes sure no code path can store "Ana@Mail.com " next to "ana@mail.com".
  email text NOT NULL UNIQUE CHECK (email = lower(btrim(email))),
  -- Only the hash. The password itself is never stored (US-E1-01).
  password_hash text NOT NULL,
  -- NULL while the email is not confirmed. An unconfirmed account cannot log in (US-E1-04).
  email_confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The link sent to confirm an email (US-E1-02).
CREATE TABLE email_confirmation_tokens (
  -- Only a hash of the token from the link, so a copy of the database can't be used to confirm accounts.
  token_hash text PRIMARY KEY,
  -- UNIQUE: one active link per account. Sending a new link replaces the old one, so the old one stops working.
  user_id uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  -- 24 hours after it was created.
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The link sent to choose a new password (US-E1-06, US-E1-07).
CREATE TABLE password_reset_tokens (
  -- Only a hash of the token from the link.
  token_hash text PRIMARY KEY,
  -- UNIQUE: a new reset link replaces the previous one.
  user_id uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  -- 30 minutes after it was created.
  expires_at timestamptz NOT NULL,
  -- Also used for the "at most one reset email every 60 seconds" rule.
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per logged-in device (US-E1-04, US-E1-05).
CREATE TABLE sessions (
  -- Only a hash of the token kept in the session cookie.
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Choosing a new password ends all sessions of the user (US-E1-07), so we look sessions up by user.
CREATE INDEX sessions_user_id_idx ON sessions (user_id);

-- Failed logins, to block guessing (US-E2-01).
CREATE TABLE login_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Normalized like users.email, but not a reference to users:
  -- emails with no account must be counted the same way, so the block doesn't reveal who has an account.
  email text NOT NULL CHECK (email = lower(btrim(email))),
  ip_address inet NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
-- The block rule reads the recent attempts of one email and IP address.
CREATE INDEX login_attempts_email_ip_idx ON login_attempts (email, ip_address, attempted_at);

-- Supabase also publishes the tables in the public schema through its own web API.
-- We don't use that API, so we turn on row level security with no policies: the API can read nothing.
-- Our server connects as the "postgres" user, which owns the tables, and the owner of a table is not affected by these rules.
-- So run this file as "postgres" too (the Supabase SQL editor and our DATABASE_URL both use it).
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_confirmation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
