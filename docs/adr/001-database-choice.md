# ADR 001: Database choice

- **Status:** Accepted
- **Date:** 2026-11-04
- **Issue:** #47
- **Implemented in:** #78

## Context

The instrument and the game run in the browser and need no database. The database is only for the **optional accounts**. It must store:

| Data | Notes |
|---|---|
| Users | Email, password hash (argon2 or bcrypt), confirmed or not |
| Email confirmation tokens | Stored only as a hash (SHA-256), with an expiry date |
| Password reset tokens | Stored only as a hash (SHA-256), with an expiry date |
| Sessions | Stored only as a hash of the session ID |
| Login attempts | To block login after too many wrong passwords (US-E2-01) |
| Settings | Key, scale, layout, dominant hand, sensitivity, camera preview (US-E5-07) |
| Game progress | Unlocked exercises and results (US-E5-10, Should) |

Camera images are never stored: they never leave the device.

The app is deployed on **Vercel**, with the server running as a serverless function. Vercel functions have **no lasting disk**: files written by one request can be gone at the next. A database file on the server, as with SQLite, would be lost.

Our architecture rules say: hand-written SQL in the repositories, **no ORM or query builder**, and the server is built with our own classes (controller → service → repository).

## Options

**Where the data lives:**

| Criterion | SQLite (`better-sqlite3`) | PostgreSQL hosted on Supabase |
|---|---|---|
| Fits our data | Yes: a few small tables | Yes: a few small tables |
| Works on Vercel | **No**: needs a lasting disk | **Yes**: the database runs outside the function |
| Team familiarity | Some | Some (SQL is the same idea) |
| Runs locally | One file, nothing to install | Shared staging database now; Docker possible later (#54) |
| Free hosting | Needs a host with a disk (not Vercel) | Supabase free tier |
| Easy to use in tests | Very easy (in-memory database) | Unit tests use fake repositories; no real database in tests |

**How the server talks to it:**

| Option | Verdict |
|---|---|
| ORM (Prisma, Drizzle) | Against our rules |
| Query builder (Kysely) | Against our rules |
| `@supabase/supabase-js` | Works like a query builder, and ties the code to Supabase. Supabase Auth would replace the accounts we are building ourselves |
| **`pg` (node-postgres) with hand-written SQL** | Matches our rules; works with any Postgres |

## Decision

- Use **PostgreSQL hosted on Supabase**. Supabase is **only the database host**: we don't use `@supabase/supabase-js` or Supabase Auth. ESLint bans `@supabase/*`.
- Connect with **`pg`**, through one shared connection pool (`shared/database/createDatabasePool.ts`), using the **transaction pooler** connection string.
- Write the SQL **by hand** in the repositories (`Postgres*Repository.ts`), always with `$1` parameters, never by joining strings.
- Only `Postgres*.ts` files and `shared/database/` may import `pg` (enforced by ESLint).
- The connection string is read from **`DATABASE_URL`**: from `packages/server/.env` locally, and from the Vercel environment variables when deployed. It is **required**: the server stops at start-up with a clear message if it is missing (fail fast).
- **Two databases:** one for staging (Vercel preview) and one for production. Locally, everyone uses the staging database.

### Schema changes (migrations)

- Each change to the schema is a numbered SQL file in `packages/server/migrations/`, for example `001_create_users.sql`, `002_create_sessions.sql`.
- Files are run **by hand**, in number order, on the staging database first, then on production (Supabase SQL editor or `psql`). No migration library.
- A file that was already run is **never edited**. To change something, add a new file.
- Before running a migration on the shared staging database, tell the team.
- Running all the files in order recreates the database from scratch.

## Consequences

- ✅ The server works on Vercel, and the data survives between requests.
- ✅ The repositories stay plain SQL, so moving to another Postgres host only changes `DATABASE_URL`.
- ✅ Services depend on repository interfaces, so they are tested with fakes and need no database.
- ⚠️ Running the server locally needs internet and a `DATABASE_URL` (see `.env.example`). The instrument itself does not need the server.
- ⚠️ Everyone shares the staging database, so local changes can affect teammates. A local Postgres with Docker (#54) would remove this.
- ⚠️ Migrations are run by hand, so someone could forget one. The numbered files make it easy to check which ones are missing.
- ⚠️ The Supabase free tier pauses a project after a period without use. If `/api/health` says `database: offline`, check that the project isn't paused.
- ⚠️ The connection is encrypted, but the certificate is not checked yet (`rejectUnauthorized: false`). We can use Supabase's CA certificate later.
