# Workbench visual implementation plan

**Goal:** Translate the editable Figma concept into the existing workbench without changing application behavior.

**Spec:** [Visual design](../specs/2026-10-13-workbench-visual-design.md). User authorized concept followed by implementation; native execution on the current branch.

## Tasks

- [x] Read current frontend/contracts, create editable desktop/mobile Figma concept and inspect it before application edits.
- [x] Add a structural regression covering all existing control IDs/contracts and valid navigation; run before implementation (RED for absent chart-stage, then GREEN; option assertions added).
- [x] Update public/index.html presentation/grouping and public/styles.css tokens/layout. Keep public/app.js, charts/results/scenarios/protocol, src/, manifests and live assets unchanged.
- [x] Run full tests (61/61), frontend integrity/diff check and obtain a fresh independent source review (no Critical/Important issues). Attempt rendered browser QA: Edge blocks the page; viewport screenshots/reflow/keyboard remain unverified. Figma desktop/mobile concepts inspected.
- [x] Update handoff/design contracts/roadmap and select only reviewed frontend/tests/docs for publication.

Publication: commit/push this checkpoint on the existing branch, verify remote SHA/CI and report the result outside this file; do not insert a self-referential commit hash.

## Review focus

Dark-stage text/chart contrast, selected-phase labels versus static workflow rail, narrow table/chart focus and overflow, active disabled controls/error states, unchanged request/storage behavior. Browser inability is a reported validation limit, not a passing screenshot.

## Remaining verification

The subsequent user cleanup removed sidebar icons/copy/extra links, static sequence and redundant labels. Actual empty/saved-run workbench rendering is now checked in the user's existing Codex in-app tab at 1440/962/768/390px; links fit one line, document has no horizontal overflow and focused narrow chart scroll works. Temporary viewport restored. Full tests 61/61 and independent source review passed. Existing controls/logic remain; original Figma is the initial concept, current spec includes cleanup.

Full screen-reader/200% zoom and exhaustive button rehearsal remain release follow-ups. No backend/network changes or new experiment records were required for this appearance checkpoint.
