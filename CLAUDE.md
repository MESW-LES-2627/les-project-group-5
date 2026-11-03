# CLAUDE.md

Guidance for AI coding assistants in this repository. Product scope: `docs/iterations/0/vision.md` and `docs/iterations/0/mvp.md`.

## Way of working

- The team rebuilds the code **step by step**, each person doing some steps. **Do only the step you were asked for.** Don't implement later steps or someone else's step.
- The team has little coding experience: keep code simple and readable, with small classes, clear names and comments that explain *why*.
- Don't add libraries, folders or packages without asking. Don't edit `CLAIM.md` or `retro.md` unless asked.
- Code, comments, commits and docs in English. Run `npm run check` before every commit.

## Stack

- TypeScript everywhere, in an npm workspaces monorepo: `packages/domain`, `packages/web`, and later `packages/server`.
- **Web:** Vite + plain TypeScript (no React or other UI framework), MediaPipe (`@mediapipe/tasks-vision`) for hand tracking, Web Audio API for sound.
- **Server:** Fastify only in the HTTP layer, Supabase (Postgres) through `@supabase/supabase-js`. **No ORM.** Manual dependency injection through constructors. Keys live in `packages/server/.env` (never committed).
- **Tools:** Vitest for tests, ESLint with `typescript-eslint` for lint and architecture rules.

## Architecture rules

1. `domain` never imports outside libraries (MediaPipe, Fastify, the database) and never uses browser APIs. ESLint (`no-restricted-imports`, `no-restricted-globals`) and the domain `tsconfig` (no `DOM` lib) enforce this.
2. MediaPipe sits behind a `HandTracker` interface. Only its adapter imports MediaPipe.
3. Audio sits behind a `Synth` interface. Only its adapter uses the Web Audio API.
4. `web` and `server` depend on `domain`. `domain` depends on nothing.
5. Server: `controller → service → repository`. Services depend on repository interfaces. Only repositories and database adapters (e.g. `SupabaseDatabaseStatus`) import `@supabase/supabase-js`.
6. The browser talks to the server only through `ApiClient`.
7. Use a design pattern only where it has a real reason in the code.
