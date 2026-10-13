# FaultNet Live Proxy Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement inline, then obtain one fresh whole-change review. Track steps below.

**Goal:** Add a working live proxy cockpit while preserving the experiment workbench and evidence.

**Architecture:** Isolate live forwarding from the fixed experiment proxy. Reuse the protected control service and Node streaming/network primitives; keep live state in memory.

**Tech Stack:** Node.js 22 ES modules, plain HTML/CSS/JavaScript, zero dependencies.

**Spec:** [Live proxy design](../specs/2026-10-13-live-proxy-design.md).

## Global constraints

Loopback ports 3000/3001/3002/8080; capability-protected control; 8192-byte JSON limit; eight rules per type; 50 memory entries; 120-second live deadline; five-second sample; no bodies/secrets/query strings in logs. Keep existing schema and lab branch intact. Write independent FaultNet source; remove reference names from current files without rewriting history.

## Review focus

- DNS aliases/rebinding must not route into protected local listeners or metadata addresses.
- Slow upload, early upstream response, disconnect and reset must settle sockets/timers without unhandled rejections.
- Compressed, HEAD and no-body responses must preserve legal framing.
- Draft edits and polling must not overwrite each other or mislabel the applied configuration.
- Rule/user content must render as text and remain absent from traffic logs.

### Task 1: Live forwarding and configuration

**Files:** Create `src/live/config.js`, `src/live/server.js`, `tests/live.test.js`.

**Interfaces:** `defaultConfig(target)`, `validateConfig(value, blockedPorts)`; `startLiveProxy({port,target,blockedPorts})` returns `port`, `getConfig`, `setConfig`, `activity`, `clearActivity`, `reset`, `probe`, `close`.

- [x] Write real HTTP tests for unified/split/query/body forwarding, configuration rejection, probability extremes/mock/header rules, delay/jitter/throttling, stalled/truncated delivery/reset, monitor capacity/privacy and forbidden destinations.
- [x] Run `node --test tests/live.test.js`; observe missing-module failure.
- [x] Implement validated memory configuration, request snapshots, DNS checks, streaming cancellation/deadlines and bounded activity.
- [x] Run targeted tests; correct actual failures. Commit together with the integration milestone after full regression checks.

### Task 2: Protected API and lifecycle

**Files:** Modify `src/app.js`, `src/control/server.js`, `src/main.js`, lifecycle/API tests and all `startApp` test fixtures.

**Interfaces:** `startApp` adds `livePort` (8080 by default, zero in tests) and returns `livePort`; control consumes the Task 1 live object. New routes follow the spec; `/` serves the cockpit and `/workbench` the old dashboard.

- [x] Write capability/origin/input/API/asset and fourth-port collision/cleanup tests; run to see failure.
- [x] Wire startup/close and safe endpoints; preserve existing experiment calls/storage.
- [x] Run `npm test`; all old and new tests pass. Update handoff and commit this complete backend milestone.

### Task 3: Cockpit and shared handoff

**Files:** Create `public/live.html`, `public/live.css`, `public/live.js`, `public/live-model.js`, `tests/live-ui.test.js`; modify the workbench navigation and current specifications/README/roadmap/handoff.

**Interfaces:** UI reads/applies the complete Task 1 configuration through Task 2 endpoints; presets edit only network values, reset cancels active live requests, polling updates only monitor, sample GET reports five-second evidence.

- [x] Write tests for draft serialization, valid preset values and activity statistics. Watch missing-module failure.
- [x] Implement the dark three-column cockpit, paired sliders/numbers, rule CRUD, summaries/visuals and clear errors; keep workbench controls intact.
- [x] Run full tests and actual-handler checks; attempt rendered browser/narrow checks and record any block explicitly; scan current reference names.
- [x] Obtain one fresh whole-change review; fix Important/Critical findings with regression evidence. Update all affected docs, review selected files, commit/push current branch, verify remote SHA and CI.

## Execution evidence

60/60 tests pass; new controls use the actual-handler harness and real local HTTP APIs. Edge rendered checks are blocked by its client and remain unverified. Fresh review findings were reproduced and fixed; 27 existing records validate without writes. Documentation/name/link and remote checks are recorded in HANDOFF.md and the final report.
