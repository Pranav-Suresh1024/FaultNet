# Implementation ledger

## Live cockpit extension — 13 October 2026

[Design](superpowers/specs/2026-10-13-live-proxy-design.md), [plan](superpowers/plans/2026-10-13-live-proxy.md), and current [handoff](../HANDOFF.md#live-proxy-extension--13-october-2026). User requested implementation on the existing application branch; independent FaultNet source and current-file reference-name removal. Experiments/schema/lab branch remain separate.

Task 1 real HTTP regressions: RED missing live modules; GREEN routing/query/method/body, both-direction pacing/delay/jitter, status extremes/mocks/header effects, legal HEAD/204/gzip, deterministic body failure/reset, privacy/capacity and destination checks. Additional early upstream response test exposed unfinished-upload cleanup and IPv4 selection issues; fixed cancellable source and settled response handling. Invalid initial config now closes any opened listener.

Task 2 RED missing livePort/collision behavior; GREEN protected config/activity/reset/clear/probe endpoints, safe asset serving, fourth-listener startup/shutdown and existing API/storage regressions. Task 3 RED missing UI/model; GREEN native controls/drafts/presets/rule CRUD/reload/reset/filter/sample. Pending sample test failed across Apply then passed after independent sample-busy tracking. Monitor polling does not overwrite drafts.

Fresh reviewer: no Critical; Important cockpit navigation rejected by same-site metadata and omitted cloud metadata destination; regraded the entry link's forced /payload as Important for a custom frontend. All three reproductions failed before their fixes and passed afterward. Targeted final live/UI tests18/18, full suite60/60,0 failures,18.2s. Delay difference510.7ms; goodputs31.71/31.82/31.88KiB/s within original bounds. No deferred minors.

Rendered Edge QA blocked by ERR_BLOCKED_BY_CLIENT; no bypass/visual/accessibility claim. Reviewer declined exact visual parity, rendered/native access, external HTTPS/other laptops/labs/CI/production and final docs. Root accepts these as explicit verification limits; docs/links/name scans are checked separately, remote CI after push. Implementation decisions: fourth listener isolates live/experiment work; stay on authorized branch; native execution/manual ignored Windows ledger; one connected milestone. No source history rewrite or new dependency.

Final running-process smoke: cockpit/workbench/assets200, 65,536-byte sample83.0ms at configured50ms delay, injected503, two monitor entries, Reset/Clear passed. Final live state normal/empty. Existing27 records validate without writes; 93 local links across22 Markdown files resolve; current reference-name scan and whitespace review pass. Remote push/CI results are checked after the local commit and reported outside HANDOFF.md.

Plan: [roadmap.md](../roadmap.md). Specification: [implementation contracts](implementation-contracts.md). Current portable state: [HANDOFF.md](../HANDOFF.md).

The user's 12 October implementation-start request resumes application work. The user then approved a reference-inspired dashboard redesign on the existing task/faultnet-mvp branch (UI base 675ce81). This checkout owns public/, UI tests, and shared design/context; teammate's Packet Tracer/.pkt work is on task/packet-tracer-labs. Lab/rubric/tool questions and recorded lab evidence remain separate gates.

## Execution and progress
- Implemented inline from the reviewed roadmap with test-first batches. No extra worktree: project guide requests the intended existing folder; task branch keeps application work off main.
- R02-R10/R13: fixed demo, validation/security, persistence, probe/metrics, all proxy faults, lifecycle/API/export implemented and locally tested.
- R11-R12: approved charcoal-shell dashboard, measured cards and phase-median chart, compact settings, saved/cross-run comparisons, and downloads implemented. Bounded browser checks and existing asynchronous regression passed. No reference implementation/dependencies were copied.
- R14: 27 local tests pass plus independent review. Previous Windows CI passed for 675ce81; new UI commit requires remote verification after push. Task-board entries remain In review until integration.
- R15-R20: separate labs, remote-laptop validation and release/report remain pending.

## Verification
Latest npm test: 27/27 PASS, 0 failures. Calibration: 513.2 ms added median for 500 ms delay; 31.79/31.82/31.71 KiB/s for 32 KiB/s limit, each 65,536 bytes. The real 15-second no-recovery test passed with observed=false and null duration. New presentation tests check phase selection, absent timing values, zero availability, and real zero timing.

Browser checks: start interruption/delay/baseline, stop throttling, phase/recovery counts, saved reopening after process restart, compatible/incompatible comparisons, keyboard Enter activation, and JSON/CSV downloads. Downloaded JSON exactly matched disk; CSV retained 7 observations. Narrow reflow and selected color contrast pairs checked; no full accessibility/browser-version certification.

## Independent review and rulings
- URL authorization used raw input while routing normalized it: reproduced unauthenticated dot-path mutation, unified the canonical path, regression passed.
- Invalid record chronology: reject observations/recovery timestamps outside the run.
- Five-second Node header timeout was scanned only every 30 seconds: configured 250 ms scanning, real partial-header socket regression passed.
- Final save failure was swallowed on shutdown: close now reports retained unsaved evidence and still closes every listener.
- Selection/export races: capture identities and ignore stale selection responses.
- Start during an older refresh: actual browser script reproduced in controlled DOM/fetch test; queued refresh/version invalidation keeps the new run selected, Stop enabled, Start disabled, and polling scheduled. Test failed before fix, passed after; final reviewer confirmed fix.
- Node fetch overrides a custom Host: hostile-Host regression uses raw HTTP, preserving production validation. Unicode capability and explicit-null default regressions corrected actual validation defects.
- Listener close is idempotent so repeated cleanup cannot interrupt recovery/final persistence.

UI independent review found a low-contrast red focus outline on charcoal; sidebar outlines are now white and browser keyboard observation confirmed the change. No other critical/important regression was found in the reviewed UI scope. Missing chart values are explicit labels; cards/medians consume existing summaries without recomputation. Hard-crash/power-loss durability, exhaustive security/accessibility, real-browser race timing, external labs and other laptops remain unverified.

## CI configuration provenance
Pinned v7 action commits were resolved from the official [checkout](https://github.com/actions/checkout) and [setup-node](https://github.com/actions/setup-node) repositories. Workflow uses read-only repository permission, no persisted checkout credentials or dependency cache, the committed runtime and npm test. The application commit's remote checkout/runtime/test steps passed; verify future tips separately.

## Workbench checkpoint — 13 October 2026

The user authorized both plans before sequential execution. Task 1 data tests failed then passed (5/5): phase selection, missing/zero values, successful statistics/distribution, baseline deltas, six valid presets and independent reuse. Task 2 controls failed then passed; original async regression retained. Browser preset input bubbling initially cleared the selection; a regression failed then passed after excluding preset events from Custom marking.

Final expansion suite: 32/32 PASS, about 18.3 seconds; delay median difference 511.0 ms and rates 31.66/31.70/31.86 KiB/s. Rendered preset/edit/reuse, stored bandwidth/recovery analysis, failed-only null distribution, real 2-probe outage with recovery (local run 1b80d458…), JSON download and 360 px reflow checked. Charts/tables stay labelled and horizontally scrollable. Full screen-reader/zoom and other-laptop runtime remain open. No new packages/schema/export fields.

Feature work stops at this checkpoint. Audit-plan reassessment is next; audit defects are not yet fixed.

## Audit fix checkpoint — 13 October 2026

Post-expansion assessment at 074754c retained all five findings and adapted input wiring for preset/reuse controls. Ruling: allow unconfirmed timeout/cancellation scheduling overrun only when completion fits actual endedAt; successful confirmation remains constrained to the window. Reason: a dispatched timeout may run late; cost if wrong is overly strict or misleading evidence, pinned by validation tests.

Storage regressions rejected fabricated before-clearance/confirmation/duration evidence on validation/save/export after RED→GREEN. Existing runner/lifecycle and valid rounding/stopped cases passed. UI regressions reproduced comparison Start lockout and missing budget feedback, then passed after panel error isolation and shared formula wiring. Stale comparison failure cannot overwrite a cleared selection.

Cancellation coverage uses the test-only Node HTTP diagnostics channel to abort after actual body bytes arrive; cancelled partial evidence, cleared fault and next complete request passed without modifying the production probe API. README duplicate historical main-push section removed.

Fresh final reviewer: no Critical findings; two Important cases (four-success delayed confirmation and unconfirmed completion past endedAt). Fix pass enforces the first qualifying streak and actual terminal completion bounds; new regression failed then passed. Storage 7/7 PASS; full suite 40/40 PASS in 18.2 seconds, calibration difference 506.6 ms / rates 31.77,31.85,31.76 KiB/s. All 20 local records validated without changes. No deferred minor findings. Reviewer declined native accessibility, other laptops, remote CI and labs; root rendered checks/CI cover their bounded scope, other-laptop/full accessibility remain open.

Browser: actual excessive 145 s budget blocked Start; mild preset and reuse restored readiness and displayed 47.5/35.4 s upper bounds. Actual bandwidth Stop recorded cancelled evidence and cleared fault, then Start re-enabled. Compatible comparison, labelled real charts and 360 px reflow/40 px keyboard scroll passed; no console errors. No lab rerun or new captures for this source change.
