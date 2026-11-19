-- Used by the job that deletes expired sessions.
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);