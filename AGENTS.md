# FaultNet agent instructions

## Start every session
1. Read [HANDOFF.md](HANDOFF.md) for the latest state, approvals, blockers, and next action.
   Read [roadmap.md](roadmap.md) for task dependencies, ownership, and acceptance checks; check the current implementation pause/resume state before coding.
   Read [implementation contracts](docs/implementation-contracts.md) for technical choices and their approval status; do not assume a proposal is approved.
   Read [implementation contracts](docs/implementation-contracts.md) for the proposed technical choices and their approval status; do not assume a proposal is approved.
2. Read [the project guide](FaultNet-Architecture-Pack/AGENTS.md) and its seven companion documents before application changes. Its project rules also apply to application files created at this repository root.
3. Inspect the actual checkout, current branch, local changes, and recent commits. Resolve differences between the handoff and the files before acting.
4. Follow [README.md](README.md) for laptop synchronization. Fetch and, on a clean branch with an upstream, pull with `--ff-only` before editing. Preserve existing local work and stop synchronization if histories diverge.

## Shared working agreement
- All application code and test code is written by AI agents; the user supplies requirements, decisions, and access, not manual code edits.
- This repository is the shared source of project context across three laptops and different Codex accounts. Do not rely on another account's chat history, memory, plugins, or local paths.
- Current authorization covers documentation, Git setup, commits, and pushes to `Pranav-Suresh1024/FaultNet`. Application work follows the latest pause/resume instruction in HANDOFF.md and requires resolution of the affected blocking decisions.
- Preserve approved decisions and visibly label proposals, unresolved details, and untested claims. A handoff does not create new authorization.
- Keep shared file references relative to this repository. Record machine-specific observations as observations, not universal setup requirements.
- Use one active writing laptop at a time for the default sequential workflow. Do not begin writes until the user identifies this laptop as the active writer if another laptop may still be working.
- For explicitly requested simultaneous work, use separate task branches and disjoint ownership; integrate through reviewed pull requests. Do not push competing work directly to `main`.
- Never force-push, discard local work, automatically resolve conflicts by choosing one side, or synchronize the `.git` directory through a file-sync service.
- Never commit credentials, Codex account data, raw captures, or generated experiment records. Review explicitly selected files before staging; `.gitignore` is not a substitute for review.

## Finish meaningful work and hand off
1. Run checks appropriate to the change, using configured commands. Report unavailable checks honestly.
2. Update HANDOFF.md in the same change: completed work, exact checks/results, new user-approved decisions, outstanding proposals/blockers, next action, and any local-only evidence.
3. Review the diff, stage only intended safe files, and make a descriptive commit at a useful milestone or before switching laptops. Avoid empty commits and unfinished application work on `main`; use a task branch for such checkpoints.
4. Push the current authorized branch. If rejected, fetch and reconcile while preserving both histories; never force-push. If access is unavailable, report the local commit and pending push explicitly.
5. Verify the remote branch SHA matches the local SHA before reporting a successful handoff. Report the branch and commit to the user, outside HANDOFF.md, to avoid a self-referential commit hash.
6. Release writing ownership only after a confirmed push. An unpushed commit cannot be continued on another laptop through GitHub.

Keep this guide concise; stable project requirements belong in the architecture pack and current progress belongs in HANDOFF.md.
