# AI Log - Iteration 2

## Tools used

Claude (Claude Code), mainly in the account features (sign up, email confirmation, login, logout), the database schema and PR reviews. Below is where we did not accept what it proposed, or where it was wrong.

Copilot for the piano layout, based on Figma prototype.

## Where we disagreed with the AI

- **"No index is needed on `expires_at`."** When expired sessions started being deleted on every login (#94), the AI argued that the `sessions` table was small and that an index would cost an extra migration. The reviewer disagreed: the delete runs on every login and the table only grows. We followed the reviewer, and the index is in its own issue (#95, PR #102).
- **Rewriting shared history.** To update stacked feature branches after a squash merge, the AI proposed a rebase and a force push. We did not accept rewriting branches that others might have pulled. We merged `staging` into the branches instead, and checked by hand that each PR still showed only its own commits.
- **Documentation nobody asked for.** The AI suggested adding a section on the database schema to the design report. We said no: the SQL migrations, with their comments, already are that documentation, and a second copy would go out of date.
- **A wrong claim about a leaked password.** The AI said a database password had been exposed in a pull request. It had not: it had been pasted in the group chat. We checked the PRs ourselves before acting on it.
- **Piano layout.** We needed to clarify the piano should show all chromatic keys, but only notes in the selected scale should be playable. We asked that work be done step by step, with permission before changes.

## Where the AI was wrong

- **The schema got ahead of the code.** The AI wrote the `user_settings` table (migration `002`) from the user stories, before the settings were built. It allowed only the layouts `'pad_grid'` and `'piano'` and made `sensitivity` mandatory, while a few days later the code used `'pad-grid'` and `'single-box'` and had no sensitivity. Nothing writes to the table yet, so nothing broke. Since then the piano layout and sensitivity were built, and today only the spelling differs (`'pad_grid'` / `'pad-grid'`). Migration `002` already ran on staging and can't be edited, so this is handled in #35.
- **It missed a cleanup.** The first version of login never deleted expired sessions, so they would stay in the database forever. The AI's tests all passed; it was the human reviewer who found it.
- **Small UI mistakes caught in testing.** The AI's CSS for the account forms overrode the `hidden` attribute, so hidden panels still showed, and its attempt to keep the header on one line made it wrap worse. Both were found by trying the pages in the browser and were fixed or reverted.
- **Piano layout.** The keyboard needed to preserve real note identities when shifting roots: C♯ should still appear as a black key. The keys were initially too opaque; We reduced their opacity so the webcam preview could show through.

**Lesson:** the AI was fast at writing code and tests, but it did not question its own assumptions. Each mistake above was caught by a person: a reviewer, a test in the browser, or a check against the real data. We keep reviewing AI work as carefully as a teammate's, and we write migrations together with the feature that uses them.
