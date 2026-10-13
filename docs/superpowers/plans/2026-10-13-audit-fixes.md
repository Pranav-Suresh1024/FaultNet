# FaultNet Audit Fixes Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, task by task. Execute only after completing and reassessing the workbench plan, as explicitly authorized by the user.

**Goal:** Correct misleading recovery evidence, UI lockout, confusing settings rejection, missing cancellation coverage, and obsolete sync guidance.

**Architecture:** Tighten existing record checks and separate data-panel errors from service readiness. Share one pure budget helper across browser/server; preserve schema v1 and public API behavior.

**Tech Stack:** Reference Node.js 22.23.1 and built-in tests; plain browser JavaScript; no external packages.

**Spec:** [Approved design](../specs/2026-10-13-workbench-design.md).

## Post-expansion consistency assessment

Assessed after checkpoint 074754c on 13 October 2026; feature development stopped before this assessment. All five audit findings remain applicable.

1. records.js/export validation is unchanged: retain chronology fix. Check all recovery starts against clearance, confirmed successful completions/window and duration with 2 ms rounding tolerance. Unconfirmed timeout/cancellation completion may exceed its scheduled window because timer dispatch is delayed; do not reject genuine failed/stopped evidence for that scheduling delay.
2. app.js still groups comparison errors with readiness: retain error isolation. New derived visuals must not prevent controls updating; stale success/error checks apply to comparison and selected-run requests.
3. Budget formula is unchanged: retain shared protocol helper. Revise UI wiring so preset, reuse, numeric/mode edits and refresh/submit all recalculate control readiness and the upper-bound message.
4. Network test still covers only delay cancellation: retain real throttled-body cancellation coverage. Prefer Node's test-only HTTP diagnostics channel to observe actual received bytes and abort the real probe, avoiding a new production callback solely for testing.
5. README still has duplicate main-push example: retain deletion.

These are adaptations to the new controls, not extra features. No schema/export or proxy behavior change is required.

## Global constraints

- First plan checkpoint required. Reassess paths/assumptions and revise this plan before implementation if they changed.
- No rewriting/deleting existing records. Invalid records remain errors; keep normal lifecycle/export compatible.
- Server remains authoritative; 120000 ms conservative budget and existing input ranges remain.
- Tests use synthetic records, temporary storage and ephemeral loopback ports.

## Review focus

- Recovery before clearance and fabricated confirmation/duration must be rejected.
- Genuine sub-millisecond rounding and stopped/no-recovery records must remain valid.
- Comparison failures and late responses must not affect service readiness or newer selections.
- Input budget at exactly 120000 passes; excessive/invalid inputs fail consistently on client/server.
- Cancellation must occur after actual body bytes, with clean next request rather than timer-only evidence.

### Task 1: Reassess and fix record chronology

**Files:** this plan; src/storage/records.js; tests/storage.test.js.

**Interfaces:** validateRecord(record) continues returning valid records or throwing record_corrupt; exports/save/reopen all consume it.

- [x] Record post-expansion consistency assessment for all five findings.
- [x] Add failing tests for recovery observations before removedAt, missing clearance, after confirmation/window, insufficient terminal streak, inconsistent duration, and valid timestamp rounding/stopped records.
- [x] Run node --test tests/storage.test.js; expect the fabricated evidence tests fail before the fix.
- [x] Validate clearance/observation completion/confirmation with documented 2 ms rounding allowance; keep monotonic duration authoritative within that tolerance.
- [x] Run node --test tests/storage.test.js tests/runner.test.js tests/lifecycle.test.js; expect valid runtime records and corrupt-record rejection pass.

### Task 2: Isolate UI errors and explain budgets

**Files:** public/app.js; public/index.html; public/styles.css; create public/protocol.js; src/control/validation.js; src/control/server.js; tests/browser-state.test.js; tests/contracts.test.js.

**Interfaces:** experimentBudgetMs(settings) and experimentLimitMs are shared pure exports. normalizeSettings uses the same formula; dashboard's control-state calculation uses service readiness and valid input, independently of data-panel errors.

- [x] Add failing UI regressions: corrupt comparison + Refresh, clear comparison, recover after selected/history errors, stale comparison response; Start stays governed by readiness and settings.
- [x] Add budget parity tests: 20/250/3000 comparison yields 145000; 10 gives 80000; comparison 15/500/3000 equals 120000; baseline has no recovery allowance. Invalid numeric input cannot start.
- [x] Run focused tests; expect failures for absent helper and error isolation.
- [x] Implement shared helper, visible conservative upper bound and actionable reduce-count/timeout/wait message; disable Start for invalid budget, restore it when corrected; keep server rejection authoritative.
- [x] Handle comparison/history/selection errors in their own panels; preserve newest-request checks on success and failure.
- [x] Run node --test tests/browser-state.test.js tests/contracts.test.js tests/api.test.js; expect pass.

### Task 3: Cancellation regression and synchronization cleanup

**Files:** tests/network.test.js; README.md; HANDOFF.md and progress/contract/testing docs.

- [x] Add a real body-stream test: abort when the first chunk is received, assert cancelled outcome/0 < bytes < 65536, unsuccessful result, clear fault none, next complete request. Use a test-only client/probe seam only if inspection proves essential; no timing-only sleep.
- [x] Run node --test tests/network.test.js; observe whether existing production behavior already passes. This finding is missing coverage, so a green existing implementation is expected and no unnecessary production fix is required.
- [x] Remove the duplicated historical Saving work section; keep current-branch instructions.
- [x] Run npm test, rendered error/budget controls and diff/link checks. Request one fresh final review, address substantive findings, update both plans/progress/handoff, commit/push and verify remote SHA/CI.
