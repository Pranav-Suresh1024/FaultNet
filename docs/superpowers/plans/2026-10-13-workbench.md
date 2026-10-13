# Experiment Workbench Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, task by task. The user explicitly authorized implementation after both plans are written.

**Goal:** Make measured experiments configurable and inspectable.

**Architecture:** Extend browser presentation of existing schema-v1 observations. Separate presets, derived analysis, and SVG rendering; retain existing HTTP APIs and server validation.

**Tech Stack:** Node.js 22.23.1, ES modules, native browser HTML/CSS/SVG, built-in Node tests; zero external packages.

**Spec:** [Approved design](../specs/2026-10-13-workbench-design.md).

## Global constraints

- Existing branch task/faultnet-mvp; preserve teammate's lab branch and local records.
- Numeric loopback only, fixed 65,536-byte demo, one active experiment, 120000 ms budget.
- No new schema/summary/export fields. Successful timing only; failures and cancellations remain explicit.
- Use textContent and fixed assets; never expose capability tokens in records or browser persistence.
- First finish this plan; then assess and adapt the [audit plan](2026-10-13-audit-fixes.md).

## Review focus

- Zero elapsed/baseline values must stay zero, with unavailable percentage change instead of division by zero.
- Missing/failed/cancelled-only phases must show no successful latency samples.
- Reusing a run must copy only editable protocol fields without changing saved evidence.
- Active-run form disabling must cover presets and reuse as well as numeric fields.
- Out-of-order browser responses must retain the newest selection and polling.

### Task 1: Presets and derived measurements

**Files:** create public/scenarios.js; modify public/results.js; test tests/ui.test.js.

**Interfaces:** scenarios exports scenarioProfiles and settingsFromRecord(record). results keeps metric/compareRuns and extends phaseView(record, preference = 'auto') with statistics, probes, outcomes, histogram, and baselineDelta. Existing summary/chart fields remain compatible.

- [ ] Write failing tests for all six valid presets, fresh copied settings, explicit recovery selection, empty/failure/cancelled samples, real zero, [0,10,20,30] mean 15 / median 15 / p95 30 / range 0–30, histogram counts, and baseline deltas.
- [ ] Run node --test tests/ui.test.js; expect assertion failures for missing helpers/new data.
- [ ] Implement immutable copied presets and derivation from observations, reusing stored summary definitions without adding stored fields.
- [ ] Run the focused tests; expect all pass.

### Task 2: Controls and visual analysis

**Files:** create public/charts.js; modify public/app.js, public/index.html, public/styles.css, src/control/server.js; update tests/browser-state.test.js.

**Interfaces:** renderCharts(document, view) updates the median, probe, distribution, and outcome regions from Task 1 data. app connects scenario/phase/reuse controls and renders captioned descriptive/probe tables.

- [ ] Add browser-harness assertions for preset application, Custom after edit, reuse without POST, explicit phase display, active settings disabling, and retain existing delayed-refresh regression. Run tests to see the new behavior absent.
- [ ] Add labelled controls and SVG regions with fixed same-origin assets. Render failures/cancellations with different symbols and text; show attempt duration separately from successful latency.
- [ ] Keep configuration changes idle-only; show editable profile descriptions and run-level recovery labels.
- [ ] Run node --test tests/ui.test.js tests/browser-state.test.js tests/api.test.js; expect all pass.

### Task 3: Verify and checkpoint the expansion

**Files:** docs/implementation-contracts.md, affected architecture specifications, README.md, HANDOFF.md, roadmap.md, docs/implementation-progress.md.

- [ ] Run npm test; expect all pass without changing tolerance.
- [ ] Render desktop/narrow UI; apply/edit presets, reuse, change phases, inspect real failure/zero/missing data, stop, compare and download. Record actual evidence and unavailable checks.
- [ ] Update approved contracts and shared progress; review safe source/tests/docs only, commit and push on current branch; verify remote SHA.
- [ ] Stop feature development. Assess every audit-plan item against this exact checkpoint and record retained/revised items before coding fixes.
