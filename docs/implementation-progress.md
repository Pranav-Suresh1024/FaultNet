# Implementation ledger

Plan: [roadmap.md](../roadmap.md). Specification: [implementation contracts](implementation-contracts.md). Current portable state: [HANDOFF.md](../HANDOFF.md).

The user's 12 October implementation-start request approves proceeding with the presented application contracts and resumes coding. Current checkout owns sequential writing; teammate is idle with access planned for the morning. Branch task/faultnet-mvp, base e60dacd. Lab/rubric/tool questions remain open for affected tasks.

## Execution and progress
- Implemented inline from the reviewed roadmap with test-first batches. No extra worktree: project guide requests the intended existing folder; task branch keeps application work off main.
- R02-R10/R13: fixed demo, validation/security, persistence, probe/metrics, all proxy faults, lifecycle/API/export implemented and locally tested.
- R11-R12: dashboard, saved/phase/cross-run comparisons and downloads implemented; bounded rendered browser checks and controlled asynchronous regression passed.
- R14: 26 local tests pass plus independent review; pinned Windows CI passed for application commit d23ef1a in [run 38171334106](https://github.com/Pranav-Suresh1024/FaultNet/actions/runs/38171334106). Task-board entries remain In review until integration.
- R15-R20: separate labs, remote-laptop validation and release/report remain pending.

## Verification
Latest npm test: 26/26 PASS, 0 failures. Calibration: 514.9 ms added median for 500 ms delay; 31.89/31.81/31.74KiB/s for 32 KiB/s limit, each 65,536 bytes. A real 15-second no-recovery test passed with observed=false and null duration.

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

Final independent targeted review: no remaining critical/important defect found in reviewed scope. Hard-crash/power-loss durability, exhaustive security/accessibility, real-browser race timing, external labs and other laptops remain unverified.

## CI configuration provenance
Pinned v7 action commits were resolved from the official [checkout](https://github.com/actions/checkout) and [setup-node](https://github.com/actions/setup-node) repositories. Workflow uses read-only repository permission, no persisted checkout credentials or dependency cache, the committed runtime and npm test. The application commit's remote checkout/runtime/test steps passed; verify future tips separately.

## Packet Tracer checkpoint — 12 October 2026

User requested static/RIPv2/OSPF coverage and upload to a separate branch. task/packet-tracer-labs adds three .pkt projects and reviewed live observations under labs/packet-tracer. See its README and LIVE-VERIFICATION.md for exact topology, results, transients, and reproducibility limits. npm test from the fresh application checkout on Node 24.14.1 passed 26/26 (about 17.8 seconds). docs/codebase-review.md contains suggestions and a reproduced saved-selection defect; application logic is unchanged. Wireshark, other laptops, reference-runtime current-branch CI, and integration remain separate checks.
