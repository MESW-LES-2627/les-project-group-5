# AI Log - Iteration 0

> **Status: pending review** by Artur.

## Tools used

- **Claude** (Anthropic), used through **Claude Code** with the Claude Opus 5.5 model, by Artur. It was used to:
  - draft the iteration 0 documents (`vision.md`, `mvp.md`, `definition-of-done.md`) from the group's decisions and Luis's proposal;
  - draft the requirements (`docs/requirements/`), the backlog issues, `decisions.md`, `START_HERE.md` and `REBUILD_GUIDE.md` (kept in the reference prototype, in the group Drive);
  - write the code and tests of the **reference vertical prototype** (kept in the group's Drive);
  - set up step 1 of the rebuild in this repository (monorepo, tools, minimal packages, `README.md` sections, `CLAUDE.md`), based on that prototype.
- **How:** the AI drafted and proposed options. Decisions came from the group and from Luis's proposal. Artur tested the reference prototype with a real camera. Artur's review of the code and documents is pending.

## One place the model was wrong

- **Left and right hand were swapped.** When it wrote the MediaPipe hand-tracking adapter, the model assumed that MediaPipe labels hands as if the camera image were mirrored, and it swapped "Left" and "Right" in the code. It flagged this as "to be confirmed with a real camera". In the camera test, the instrument only reacted to the **left** hand, although the right hand is the default. In fact, with the unmirrored camera image we give it, MediaPipe already labels the player's real hand. We removed the swap and added a unit test (`handedness.test.ts`) so it can't come back. **Lesson:** assumptions about how a library behaves must be checked with real hardware early, and it helps when the AI says clearly what it hasn't verified.
