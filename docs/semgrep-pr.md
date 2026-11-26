<!-- Title: ci: add a Semgrep security scan with a summary comment on PRs -->

## What

Adds a **Semgrep security scan** to CI, with rules for our stack and a summary comment on every pull request.

- **CI (`.github/workflows/ci.yml`):**
  - New `semgrep` job on every pull request and on pushes to `staging` / `main`.
  - Steps: install Semgrep 1.187.0 with `pipx` → `semgrep --test` on our rules → scan → build the summary → comment on the PR → fail if there are findings.
  - Rule packs: `p/javascript`, `p/typescript`, `p/nodejs`, `p/secrets`, `p/github-actions`, `p/dockerfile`, plus `.semgrep/rules.yml`.
  - **Any finding fails the job**, and `deploy` now needs `[check, semgrep]`.
  - `actions/checkout` and `actions/setup-node` are pinned to a commit SHA (with a `# v4` comment). `p/github-actions` blocks tags because a tag can be moved to other code.
- **Our own rules (`.semgrep/rules.yml`)**, 8 rules:

  | Rule | Catches |
  |---|---|
  | `sql-built-with-string-interpolation` | SQL in `query()` built with `${}` or `+` instead of `$1` placeholders |
  | `insecure-random-on-server` | `Math.random()` in the server |
  | `secret-compared-with-equality-operator` | a token, hash or password compared with `===` (warning) |
  | `hardcoded-database-url` | a `postgres://user:pass@` URL in the code |
  | `sensitive-value-logged` | a password, token or hash passed to `console` or `request.log` |
  | `cookie-without-httponly` | `setCookie` without `httpOnly: true` |
  | `open-redirect-from-request` | `reply.redirect` with a target taken from the request |
  | `untrusted-data-in-innerhtml` | form input, the URL or server data reaching `innerHTML` (XSS) |

  `.semgrep/rules.ts` has a "must flag" and a "must not flag" example for each rule, and CI runs them with `semgrep --test`. ESLint ignores `.semgrep/` because those examples are insecure on purpose.
- **PR comment (`scripts/semgrep-summary.mjs`):** turns Semgrep's JSON into Markdown: ✅ no findings, or a table with severity, rule, a link to the line and the message. A hidden `<!-- semgrep-summary -->` marker lets new pushes **update the same comment** instead of adding more. The same summary is on the run's Summary page.
- **`.semgrepignore`:** skips `node_modules`, build output, `api/`, MediaPipe files and generated docs.
- **README:** new "Security scan (Semgrep)" section explaining how to install and run Semgrep locally (or with Docker), and what to do with a finding.

## Why

Implements #<task-number>.

The project handles passwords, session cookies, email tokens and hand-written SQL. Semgrep catches the common mistakes there (SQL injection, XSS, weak tokens, leaked secrets) automatically, before review.

Decisions:
- **Semgrep runs on the runner, not in its Docker image.** The comment step needs Node and `gh`, which the runner already has and the image doesn't.
- **The scan doesn't use `--error`.** The job has to keep going to write the comment, so the last step fails it instead.
- **The comment step has `continue-on-error`.** If the token can't write (for example, a PR from a fork), the scan result still decides whether the job passes.
- **The `innerHTML` rule only follows untrusted data** (form input, URL, server answers). The pages that build HTML from fixed values (notes, options) aren't flagged.

⚠️ **Known risk, not fixed here:** `createDatabasePool.ts` connects to Supabase with `rejectUnauthorized: false`. The connection is encrypted, but the server doesn't check who it is talking to, so a man-in-the-middle is possible. That was a deliberate choice (see the comment in the file), so it is marked with `// nosemgrep` and a reason. The proper fix (ship Supabase's CA certificate and use `ssl: { ca }`) should be its own task.

## How to test

1. Install Semgrep (`brew install semgrep` or `pipx install semgrep`).
2. `semgrep --test --config .semgrep/rules.yml .semgrep/rules.ts --metrics=off` → `8/8: ✓ All tests passed`.
3. Run the full scan from the README → `Findings: 0`.
4. On this PR: the `semgrep` job passes, and a comment **"🔍 Semgrep security scan — ✅ No findings"** appears.
5. Try a finding: in a test branch, add ``pool.query(`SELECT * FROM users WHERE email = '${email}'`)`` to a server file and push. The job fails, and the **same** comment changes to a table with `sql-built-with-string-interpolation` and a link to the line. Remove it and push: the comment goes back to ✅.
6. `npm run check` passes.

## Definition of done

- [ ] All acceptance criteria pass
- [ ] Unit tests for rules / integration tests for server routes / manual test for camera and sound — *the custom rules have `semgrep --test` examples*
- [ ] `npm run check` passes
- [ ] Docs updated (what the feature does and how to test it)
- [ ] Reviewed and approved by someone else in the group
- [ ] Tested and approved by the product owner

Closes #<task-number>
