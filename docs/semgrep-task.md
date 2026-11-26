# [Task] Add a Semgrep security scan to CI

## What needs to be done

Add a static security scan with [Semgrep](https://semgrep.dev/) to the CI pipeline (`.github/workflows/ci.yml`), so common security mistakes are caught on every pull request, before the code reaches `staging` or `main`.

**1. New `semgrep` job in CI**

- Runs on every pull request and on every push to `staging` and `main`.
- Installs a pinned Semgrep version (not an npm dependency of the app).
- Any finding fails the job. `deploy` only runs when both `check` and `semgrep` pass.
- On a pull request, writes **one comment with the scan summary**: ✅ no findings, or a table with the rule, severity, a link to the line and the message. Later pushes update the same comment instead of adding new ones.
- Pins `actions/checkout` and `actions/setup-node` to a commit SHA instead of `@v4`, because `p/github-actions` flags tags that can be moved.

**2. Public rule packs to use**

| Pack | What it checks |
|---|---|
| `p/javascript` | General JS security problems (`eval`, unsafe regex, prototype pollution, …) |
| `p/typescript` | The same for TypeScript-specific code |
| `p/nodejs` | Node.js problems (TLS checks turned off, command injection, unsafe `child_process`, …) |
| `p/secrets` | Passwords, API keys and tokens written in the code |
| `p/github-actions` | Workflow problems (script injection from PR data, actions not pinned to a SHA) |
| `p/dockerfile` | Dockerfile problems (running as root, unpinned images, …) |

**3. Our own rules in `.semgrep/rules.yml`**

| Rule id | Severity | Where | Catches | Safe way |
|---|---|---|---|---|
| `sql-built-with-string-interpolation` | ERROR | `packages/server/` | `query()` with SQL built from `${}` or `+` (SQL injection) | Placeholders: `query('… WHERE email = $1', [email])` |
| `insecure-random-on-server` | ERROR | `packages/server/` | `Math.random()` (predictable tokens and salts) | `randomBytes()` / `randomUUID()` from `node:crypto` |
| `secret-compared-with-equality-operator` | WARNING | `packages/server/src/` (not tests) | a token, hash, password or secret compared with `===`, `!==`, `==` or `!=` (timing attack). Checks against `undefined`, `null` or `''` are allowed | `timingSafeEqual()` from `node:crypto` |
| `hardcoded-database-url` | ERROR | everywhere | a `postgres://user:password@…` URL in the code | Read it from `DATABASE_URL` |
| `sensitive-value-logged` | ERROR | `packages/server/src/` | `password`, `passwordHash`, `token`, `tokenHash`, `secret` or `databaseUrl` passed to `console.*` or `request.log.*` | Log an id or a message |
| `cookie-without-httponly` | ERROR | `packages/server/src/` | `reply.setCookie()` without `httpOnly: true` | Same options as `SessionController.cookieOptions()` |
| `open-redirect-from-request` | ERROR | `packages/server/src/` | `reply.redirect()` to a URL taken from `request.query`, `params`, `body` or `headers` | Redirect only to fixed paths |
| `untrusted-data-in-innerhtml` | ERROR | `packages/web/src/` | form input (`input.value`, `FormData`), the URL (`location`, `URLSearchParams`) or server data (`fetch`, `ApiClient`) reaching `innerHTML`, `outerHTML`, `insertAdjacentHTML` or `document.write` (XSS) | `textContent` or `document.createElement` |

- Each rule has a "must flag" (`// ruleid:`) and a "must not flag" (`// ok:`) example in `.semgrep/rules.ts`, and CI runs `semgrep --test` on them.
- ESLint ignores `.semgrep/`, because those examples are insecure on purpose.

**4. Other files**

- `.semgrepignore`: skip `node_modules/`, `dist/`, `coverage/`, `api/`, `packages/web/public/mediapipe/`, `docs/code-doc/`, `package-lock.json` and `.semgrep/`.
- `createDatabasePool.ts`: the TLS check turned off for Supabase (`rejectUnauthorized: false`) is a deliberate choice. Mark it with `// nosemgrep` and a reason. The proper fix (Supabase's CA certificate) is a separate task.
- README: how to install and run Semgrep locally (or with Docker), and what to do with a finding (fix it, or `// nosemgrep: <rule-id>` with a reason).

## Done when

- [ ] The `semgrep` job runs on pull requests and on pushes to `staging` and `main`
- [ ] It scans with the 6 public packs and the 8 custom rules listed above
- [ ] `semgrep --test` passes in CI for all 8 custom rules
- [ ] The scan finds nothing on the current code: real problems fixed, deliberate exceptions marked with `// nosemgrep` and a reason
- [ ] A finding makes the job fail, and `deploy` doesn't run
- [ ] The pull request gets a summary comment, and a new push updates that comment instead of adding another
- [ ] All actions in `ci.yml` are pinned to a commit SHA
- [ ] README explains how to run Semgrep locally and how to handle a finding
- [ ] `npm run check` passes
