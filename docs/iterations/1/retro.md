# Retrospective - Iteration 1

## What went well

- **Group work and communication.** The group chat stayed active all iteration, and questions were usually answered within the same day. Technical decisions, such as the database choice and the "fail fast without `DATABASE_URL`" rule, were discussed and agreed in the chat before anyone wrote code. When something blocked the team, like the staging preview asking for a Vercel login, it was reported and fixed in minutes.
- **Documentation.** We documented decisions as we made them, not at the end:
  - the database choice is recorded in ADR 001, together with how schema changes (migrations) are handled;
  - the domain model and the component diagram were updated for this iteration;
  - `CONTRIBUTING.md` explains the branch flow and the commit convention;
  - TypeDoc generates the code documentation.

  Anyone in the team can read *why* the project looks the way it does, without having to ask.
- **PR reviews.** Every feature reached `staging` through a pull request, and the CI ran lint, type checks and tests on each one. Reviewers did more than read the diff: they ran the app and tried the feature in the browser. Reviews found real problems before the merge, and in one case changes were requested and made before the PR was approved.

## What we should do different

- **Time management.** Most of the work landed in the last days of the iteration. Several PRs were merged on the last two days, and the CLAIM, the retrospective and the AI log were written on the last evening. This left little time to test the whole increment together. When a deploy failed close to the deadline, there was no margin to investigate it calmly. In the next iteration we want to merge features earlier and keep the last day for testing and closing.
- **Issues assignment.** Some issues had no clear owner, and it was not always clear who was working on what. The requested reviewer was not always the person who actually reviewed. We should assign every issue at the planning meeting, keep the assignee up to date on GitHub, and agree in the chat who reviews each PR.
- **Better use of AI.** AI tools helped us move faster, but we also saw their risks. In one PR, an AI assistant changed files and behaviour that the task did not ask for: styles, part of the base code and how the notes sound. These changes were hard to notice and took time to find and undo. In the next iteration:
  - keep PRs small and focused on one issue;
  - read every AI-generated change before committing it;
  - point the assistant to `CLAUDE.md`, so it follows the project rules;
  - log the AI use and its mistakes honestly in the AI log.

## Are there any puzzles

- **Issue organization.** We still don't have a clear way to group issues by iteration. We use labels and epics, but no milestones, so it is hard to answer "what is in this increment?" from GitHub alone. We also need to agree on what is a user story, a task and a spike, and on when to close an issue: when its PR is merged into `staging`, or only when it reaches `main` in production.
- **Issue estimation.** We haven't estimated issues yet, so we can't tell in advance whether an iteration has too much or too little work. With our little coding experience, estimates are hard to make. We need to choose a simple method that the whole team understands, for example small/medium/large sizes or story points, and then compare the estimates with the real effort at the end of each iteration.

## What we will try in Iteration 2

- Plan the iteration in the first meeting, with an owner and a size for every issue.
- Merge features into `staging` before the last two days of the iteration.
- Keep using pull requests for everything that goes into `staging`, documentation included.
- Review AI-generated code as carefully as code written by a teammate.
