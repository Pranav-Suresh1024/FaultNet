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

Render the implemented workbench in an accessible browser and exercise controls/focus/scrolling at 1440/768/390px and 200% zoom. This is a release follow-up, not completed screenshot evidence. No backend/network changes or new experiment records were required for this appearance checkpoint.
