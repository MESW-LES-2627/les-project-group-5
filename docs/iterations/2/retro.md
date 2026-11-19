# Retrospective - Iteration 2

## What went well

- **Features landed earlier.** In Iteration 1 most of the work arrived in the last two days. This time the work was spread out:
  - the database schema and sign up were merged on 11/11;
  - the layout choice on 14/11;
  - email confirmation, login and logout on 15/11;
  - the piano layout on 16/11;
  - sensitivity and the Docker setup on 18/11.

  This left time to test the increment as a whole and to fix problems before the deadline.
- **Reviews that changed the code.** Reviews were more than an approval click. Reviewers ran the branch and tried the feature, and several PRs were changed because of them:
  - in #94, the reviewer noticed that expired sessions were never deleted, and asked for a cleanup on every login;
  - #97 (sensitivity) and #98 (keeping the settings in a cookie) also got changes requested.

  One teammate tested #91 on their own machine by following the steps in the PR, which also showed that the "How to test" section works for someone who didn't write the code.
- **The team helped each other.** When a teammate's local server showed "database offline", the error was pasted in the chat and solved in a few minutes: an extra quote at the end of `DATABASE_URL`. When the staging deploy failed, it was found that the free Supabase database had been paused, and it was resumed the same day.
- **Better tools for everyone.**
  - With the Docker setup (#89), anyone can run the web app, the server and a **local** PostgreSQL with one command. Nobody needs the Supabase password to work, and nobody can break the shared database while testing.
  - The email sender (#99) and the pre-commit lint (#103) are on their way.
- **Estimates exist now.** The board has an *Estimate* and a *Real Estimate* field, and most issues have both. This answers one of the puzzles from Iteration 1.

## What we should do different

- **Estimate at planning, not at the end.** Many estimates were filled in on the last days, after the work was done. An estimate written after the work can't tell us whether the iteration was too big. In Iteration 3, every issue gets its estimate in the planning meeting, and only the *Real Estimate* is filled at the end.
- **Record every review on GitHub.** Some PRs were reviewed in the chat or tested by a teammate, but merged with no review recorded on GitHub (for example #88, #91 and #92). The review happened, but nobody reading the repository can see it. Every PR should have its reviewer requested on GitHub, and the approval given there.
- **Keep the database in step with the code.** The `user_settings` table was created from the user stories before the settings were built, and the code later used different values (`'pad-grid'` and `'single-box'`, not `'pad_grid'` and `'piano'`). A migration should be written together with the feature that uses it. Migrations also have to be run by hand on staging and production, which is easy to forget at release time.
- **Never paste secrets in the chat.** A database connection string, with its password, was pasted in the group chat. Secrets belong only in each person's `.env` file and in the Vercel settings. Now, with Docker, most of us don't need the shared password at all.
- **Too many PRs open at the end.** Five PRs were still open on the last day (#98, #99, #100, #102, #103). Smaller PRs, opened and reviewed earlier, would leave the last days for testing and closing the iteration.

## Are there any puzzles

- **Free-tier limits.** This iteration we hit two of them: the GitHub Actions minutes of the organization ran out, so CI and deploys stopped, and the free Supabase database pauses itself after some days without use. We don't yet know the best way around them (a public repository, a scheduled ping, or paid plans) without depending on luck near a deadline.
- **What the estimates mean.** We have numbers, but not a shared unit: some read them as hours, others as relative size. The *Real Estimate* values (from 1 to 7, and one 1.5) only help if everyone uses the same unit.
- **When an issue is done.** Issues only close by themselves when a PR reaches `main`, but our features are merged into `staging` first. So the board can show an issue as Done while the issue itself is still open. We need to agree on which one is the truth.

## What we will try in Iteration 3

- Estimate every issue in the planning meeting, in one agreed unit, and compare with the real effort at the end.
- Request a reviewer on GitHub for every PR, and approve or request changes there.
- Write each migration in the same PR as the feature that uses it, and add "run the migrations on production" to the release checklist.
- Use the Docker setup and its local database for testing, instead of the shared one.
- Open smaller PRs earlier, and keep the last two days for testing and closing the iteration.
