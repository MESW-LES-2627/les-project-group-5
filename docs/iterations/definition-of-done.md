# Definition of Done

*Approved by the group on 19 Oct 2026.*

A user story is **done** only when **all** of these are true:

1. **Acceptance criteria pass.** Every acceptance criterion of the story has been checked and passes.
2. **Automated tests where they make sense:**
   - **unit tests** for core rules (required);
   - **integration tests** for server routes;
   - a **manual test** for parts that depend on the camera or on sound.
3. **Acceptance test by the product owner.** Luis has tested the story and approved it.
4. **Checks pass.** `npm run check` passes (lint, type check and all tests).
5. **Code review.** Someone else in the group has reviewed and approved the pull request.
6. **Documentation updated.** What the feature does and how to test it are written down.
7. **Merged** into the main branch.
