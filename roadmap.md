# FaultNet project roadmap

**Goal:** Deliver a reproducible local network-resilience lab with baseline/fault/recovery measurements, saved results, exports, and separate network-lab evidence.

**Status:** Application checkpoints from `task/faultnet-mvp` are integrated into `main` through [PR #1](https://github.com/Pranav-Suresh1024/FaultNet/pull/1), explicitly authorized by the user. Main is the shared application baseline. Lab integration, remaining UI acceptance, report/release and other-laptop validation remain pending.

**Architecture:** Plain browser cockpit/workbench, Node.js control, fixed demo/experiment proxy, separate live development proxy, and local JSON experiment records. Control stays usable while application traffic is impaired. Packet Tracer and Wireshark provide separate evidence.

**Source specifications:** [PRD](FaultNet-Architecture-Pack/docs/PRD.md), [Architecture](FaultNet-Architecture-Pack/docs/ARCHITECTURE.md), [Database](FaultNet-Architecture-Pack/docs/DATABASE.md), [Security](FaultNet-Architecture-Pack/docs/SECURITY.md), [Design System](FaultNet-Architecture-Pack/docs/DESIGN_SYSTEM.md), [Code Style](FaultNet-Architecture-Pack/docs/CODE_STYLE.md), and [Testing](FaultNet-Architecture-Pack/docs/TESTING.md).

The [application contracts](docs/implementation-contracts.md) define the concrete API/protocol. Actual module/test paths are in the task branch; laptop lanes remain proposals until assigned. Resolve lab-specific choices before affected lab work.

The user approved the reference-inspired UI redesign on the existing task/faultnet-mvp branch. This checkout owns public/, UI tests, and shared design/context; teammate is working on Packet Tracer in a separate task/packet-tracer-labs branch. Application implementation is resumed. [Implementation evidence](docs/implementation-progress.md) records checks and remaining limits. Keep lab work separate and reconcile shared context during integration.

## Global constraints

- Agents write all application and test code. The user supplies decisions and access; GUI observations may require the user's machine.
- Windows-first, Node.js, plain HTML/CSS/JavaScript, and local JSON. No frontend framework, TypeScript, or database service has been approved.
- Experiment injection affects only the fixed demo; the 13 October live extension supports protected, validated development origins. All listeners bind to loopback and enforce browser-origin boundaries.
- No public deployment, production traffic, unconfigured forward proxying, genuine IP packet-loss injection, or automatic Packet Tracer/Wireshark integration.
- Measurements distinguish HTTP outcomes from RTT, retransmissions, and packet loss. Missing observations are not zero or fabricated success.
- Records/logs/exports exclude request bodies, credentials, and cookies. Review captures before any sharing; generated evidence is not automatically backed up by Git.
- Application runtime, ports, packages, limits, API/schema, and visual tokens follow the approved contracts. Lab scenarios remain R01 decisions. Use Node's built-in capabilities.

## Coordination across two active laptops
The user requested the live proxy extension on 13 October. Its [design](docs/superpowers/specs/2026-10-13-live-proxy-design.md) and [plan](docs/superpowers/plans/2026-10-13-live-proxy.md) cover R23: configuration/forwarding, protected API/lifecycle, then cockpit/review/handoff. This application's laptop owns all affected source/tests/context on task/faultnet-mvp; the teammate's Packet Tracer branch remains separate. Fixed schema/results are preserved.


Use A, B, and C as logical responsibility lanes, not laptop counts. The user confirmed two active laptops on 13 October 2026; the third is inactive. Lanes can also be executed sequentially on one laptop; no simultaneous work is assumed or authorized by this document.

| Lane | Proposed responsibility | Exclusive/shared-file boundary |
| --- | --- | --- |
| A: Integration | Contracts, demo/control servers, lifecycle, API integration, final release | Owns shared contracts, package/config files, CI configuration, roadmap, handoff, and specification updates |
| B: Experiments | Probe/metrics, proxy faults, persistence, exports | Owns assigned backend modules and their scoped tests; consumes A's frozen contracts |
| C: Dashboard and lab | Browser UI, UI tests, network-lab procedures, reviewed report material | Owns assigned public assets and lab files; consumes A's frozen API/schema |

For sequential laptop switching, follow [README.md](README.md): update context, commit, push, verify the remote SHA, then hand over writing ownership.

For explicitly requested parallel work:
1. A commits the task claim to this board and pushes it before another laptop starts. Record laptop, branch, owned paths, contract/base commit, and reviewer. Concurrent claims require A to reconcile them before work starts.
2. Each task uses a branch such as `task/r06-delay`, based on the latest required dependencies. Do not share a working directory or push competing work to `main`.
3. An agent edits only its owned files and scoped tests. Shared-file changes are proposed in its PR handoff for A to integrate; no silent interface changes.
4. Task branches use their PR descriptions for progress and test evidence. A updates the shared roadmap/HANDOFF.md when integrating, preventing multiple agents from editing the same progress file.
5. The assigned reviewer checks behavior, failure paths, security, and contract compatibility. Integrate only after the task's acceptance checks pass and merge authorization is established.
6. Re-run affected integration checks against the combined tree. Individual branch checks do not prove the combined application works.

Each active laptop authenticates independently. A teammate's different GitHub account needs collaborator write access to push to a private repository. Each Codex account reads committed context; local account memory is not a shared dependency.

## Task board

Status meanings: **Done** = integrated and verified; **Ready** = dependencies and approval resolved; **Blocked** = named dependency/decision missing; **Planned** = not started. Use **In progress** and **In review** only when actually claimed. A planned lane is not an assigned laptop.

| ID | Small deliverable | Depends on | Lane | Status | Assigned laptop / branch / evidence |
| --- | --- | --- | --- | --- | --- |
| R00 | Repository and portable context | None | A | Done | Setup verified in commit `1e75729`; other laptops' access unverified |
| R01 | Approve runtime, measurement, API/schema, security, UI, and lab contracts | User resumes implementation | A + user | In review | Application approved; 30-mark rubric supplied 14 Oct; remaining lab/release details open |
| R02 | Fixed demo response and startup/shutdown | R01 | A | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R03 | Local control security and input validation | R01 | A | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R04 | JSON record persistence and safe reads | R01 | B | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R05 | Probe outcomes and measurement calculations | R01, R02 | B | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R06 | Pass-through proxy and delay fault | R01, R02 | B | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R07 | Bounded bandwidth restriction | R06 | B | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R08 | Connection interruption and fault reset | R06 | B | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R09 | Baseline/fault/recovery lifecycle and cancellation | R03-R08 | A | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R10 | Control/result API integration | R09 | A | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R11 | Accessible dashboard controls and states | R01, R10 | C | In review | main / PR #1; controls integrated; full accessibility/zoom acceptance remains |
| R12 | Phase comparison and saved-run browser | R04, R05, R11 | C | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R13 | JSON/CSV export and dashboard download | R04, R05, R10, R12 | B then C | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R14 | End-to-end, failure-path, and security regression checks | R07-R13 | A | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R15 | Packet Tracer procedure and topology | R01 lab decisions | C | In review | Teammate / task/packet-tracer-labs / 9f72386; three saved projects independently opened/config reviewed, not merged |
| R16 | Recorded Packet Tracer evidence | R15 | C | In review | Static outage and RIP/OSPF alternate routes independently checked; see docs/packet-tracer-review.md for scope/transients |
| R17 | Wireshark capture procedure | R01 lab decisions, R06 | C | In review | docs/wireshark-guide.md; Wireshark 4.6.9/loopback and actual capture permissions verified on current laptop |
| R18 | Recorded Wireshark evidence | R14, R17 | C | In review | Current laptop / task/faultnet-mvp; four scenarios in one bounded capture, sanitized observations in docs/verification-2026-10-13.md |
| R19 | Fresh-checkout verification across both active laptops | R14 | A + both laptops | Planned | Lab branch upload confirmed; other laptop's application checkout/runtime still unverified |
| R20 | Final report, demo instructions, and release checkpoint | R14, R16, R18, R19 | A then C | In progress | Revised report on task/final-report: 28 pages, six DOI-verified papers, sanitized numerical inputs, exact revisions/checksums, expanded contents and reproduction appendix; user-supplied cockpit overview and readable monitor detail included; full rehearsal, other-laptop checks and release acceptance remain separate |
| R21 | Editable experiment workbench | User's 13 Oct approval, R14 | Current laptop | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R22 | Reassessed audit fixes | R21 checkpoint | Current laptop | Done | main / PR #1; automated/bounded runtime checks and independent reviews in implementation ledger |
| R23 | Live proxy cockpit and traffic controls | User's 13 Oct expansion request, R22 | Current laptop | In review | main / PR #1; live forwarding/cockpit integrated; full rendered live-control rehearsal remains |
| R24 | Figma-first workbench visual redesign and cleanup | User's 13 Oct frontend-only/refinement requests, R21/R22 | Current laptop | In review | Two-link sidebar, filler removed; native HTML/CSS, preserved controls/logic; 61 tests, integrated via PR #1; bounded rendering/reflow passed, full keyboard/zoom acceptance remains |

## Task details and completion checks

### R01: Freeze decisions before parallel implementation

**Owns:** Updates to the seven specification documents and shared contracts. No application code.

**Contract artifact:** [docs/implementation-contracts.md](docs/implementation-contracts.md). The user resumed application implementation after the proposal. Application decisions are approved; the user supplied the 30-mark rubric on 14 October and it is mapped in docs/demo-script.md. Remaining lab/tool/release details are open. Teammate access is not a blocker for this sequential local application work.

- [ ] Implementation resume and individual rubric are recorded (Understand 3 / Apply 5 / Analyze 7 / Evaluate/higher 10 / Report 5). User indicated next-day submission on 14 October; exact submission time and mandatory report format remain unspecified.
- [ ] Approve runtime/module format, required packages (if any), ports, storage directory, and proposed file ownership. Define reproducible start/test commands as planned commands until implemented and verified.
- [ ] Approve the demo's expected status/body contract; probe counts, intervals, timeout/payload limits, fault limits, concurrency, and maximum experiment duration.
- [ ] Define availability denominator, cancellation handling, timing/throughput units, percentile rule, recovery success count/window, and timing/throttling test tolerances. Clarify whether a baseline-only run is supported.
- [ ] Freeze route methods, request/response/error shapes, status codes, identifiers, record schema/version, and repeated-stop behavior. Define corruption handling and comparison compatibility.
- [ ] Approve Host/Origin checks and any session capability, request/resource bounds, shutdown cleanup, UI layout/tokens/accessibility criteria, and required separate lab scenarios.

**Done when:** The owner approves concrete choices; all affected documents agree; downstream agents can implement without inventing contracts. Save the contracts and plan detail with the codebase.

### R02: Fixed demo server

**Proposed files:** `src/demo/server.js`, `tests/demo.test.js`; A owns startup/config integration.

- [ ] Serve only the approved synthetic response on the fixed local route.
- [ ] Test exact status/body size, unsupported routes/methods, port conflicts, and clean shutdown without orphan listeners.

**Done when:** An automated local test can start, probe, and close the server; no arbitrary target or content source is accepted. **Coverage:** F-01 foundation.

### R03: Control security and validation

**Proposed files:** `src/control/security.js`, `src/control/validation.js`, `tests/control-security.test.js`.

- [ ] Enforce the approved local listener, Host/Origin/session-capability rules, methods, request size, settings bounds, and identifier validation.
- [ ] Test cross-origin requests, hostile Host, malformed/oversized JSON, forbidden settings, and path traversal; denial must not alter state or expose records.

**Done when:** Both intended dashboard requests and prohibited-request tests behave as specified. **Coverage:** F-07 and security boundaries.

### R04: Local JSON persistence

**Proposed files:** `src/storage/records.js`, `tests/records.test.js`, synthetic schema fixtures under `tests/fixtures/`.

- [ ] Write/read/list approved versioned records using a fixed root and safe identifiers; retain evidence until explicitly deleted outside the app.
- [ ] Test reopen, interrupted writes, corrupt/unsupported records, missing files, and storage permission failures. Preserve original evidence and surface errors.

**Done when:** A saved record survives restart and failures cannot masquerade as a successful save. Use temporary test storage. **Coverage:** F-05.

### R05: Probe and metrics

**Proposed files:** `src/experiments/probe.js`, `src/experiments/metrics.js`, `tests/probe.test.js`, `tests/metrics.test.js`.

- [ ] Probe the fixed demo path with bounded timing and cancellation; record complete response, timeout, connection error, interruption, and cancellation without hidden retries.
- [ ] Calculate approved availability/timing/throughput summaries from observations. Test empty runs, incomplete bodies, zero-byte observations, cancelled attempts, and known synthetic samples.

**Done when:** Formula tests are exact and transport tests distinguish unavailable values from zero. Request elapsed time is not labeled network RTT. **Coverage:** F-01, F-03/F-04 calculations.

### R06: Pass-through proxy and delay

**Proposed files:** `src/proxy/server.js`, `src/proxy/faults.js`, `tests/proxy-delay.test.js`.

- [ ] Forward only to the fixed demo; demonstrate normal forwarding before adding approved delay semantics.
- [ ] Test response preservation, delay within approved tolerance, invalid delay rejection, reset, and cancellation during a pending delay.

**Done when:** Normal and delayed requests are reproducible and controls remain responsive. **Coverage:** F-02 delay.

### R07: Bandwidth restriction

**Owns:** The proxy fault implementation after R06 and `tests/proxy-bandwidth.test.js`; no concurrent edits to R08's shared proxy files.

- [ ] Implement the approved stream-rate definition with bounded buffering and no busy loop.
- [ ] Measure a known payload over the approved window/tolerance; test cancellation, backpressure, reset, and invalid rates.

**Done when:** Delivered throughput agrees with the defined test protocol, and unrestricted forwarding is restored. **Coverage:** F-02 bandwidth.

### R08: Connection interruption

**Owns:** The proxy fault implementation after R06 and `tests/proxy-interruption.test.js`; schedule after R07 if both edit the same files.

- [ ] Interrupt connections according to the approved contract; identify this as application/transport interruption rather than IP packet loss.
- [ ] Test interruption, fault reset, active-socket cleanup, and normal forwarding after reset.

**Done when:** Requests fail for the intended reason and recover after clearing the fault. **Coverage:** F-02 interruption.

### R09: Experiment lifecycle

**Proposed files:** `src/experiments/runner.js`, `tests/runner.test.js`.

- [ ] Combine approved phases, settings, proxy behavior, probe observations, and persistence; enforce one active experiment if approved in R01.
- [ ] Test phase order, busy rejection, unavailable demo, stop during every fault, repeated stop, duration bounds, and shutdown. Clear faults on every exit path.
- [ ] Test recovery streak reset, recovery-window exhaustion, and not-observed recovery without invented duration; retain incomplete evidence and failed saves explicitly.

**Done when:** A stopped or failed experiment cannot leave faults enabled or claim unobserved recovery. **Coverage:** F-01/F-02/F-03/F-05/F-07.

### R10: API integration

**Proposed files:** `src/control/server.js`, `src/main.js`, `tests/api.test.js`; package/startup files remain A-owned.

- [ ] Wire status, start/stop, list/read, and planned export routes to the frozen contracts, applying R03 protections to all appropriate routes.
- [ ] Test readiness, lifecycle status, unknown record, conflicting start, malformed input, and safe errors; never return unrestricted paths or sensitive internals.

**Done when:** Real HTTP requests exercise the integrated behavior with reproducible startup/cleanup. **Coverage:** F-01/F-03/F-05/F-07.

### R11: Dashboard controls and states

**Proposed files:** `public/index.html`, `public/styles.css`, `public/app.js`, `tests/ui-controls.test.js` if a browser test tool is approved.

- [ ] Implement labeled settings, start/stop, readiness, phase status, and loading/empty/error/running/stopped states against R10.
- [ ] Verify duplicate-start prevention, visible validation and failure messages, keyboard operation, focus, contrast, reduced motion, and safe text rendering. Record the browser/procedure when verification is observational.

**Done when:** The dashboard can control a real run and remains usable during all faults; stop and confirmed fault clearance are distinct. **Coverage:** F-01/F-02/F-03/F-07.

### R12: Comparison and saved runs

**Owns:** C's UI files and `tests/ui-results.test.js` if configured.

- [ ] Show baseline/fault/recovery values with units, settings, sample counts, missing values, incomplete records, and saved-run selection.
- [ ] Test compatible comparisons, incompatible settings/schema warnings, empty history, reload, corrupt-record notices, and stale asynchronous responses.

**Done when:** Displayed summaries match backend observations and reopening results preserves labels and settings. **Coverage:** F-04/F-05/F-07.

### R13: Export

**Proposed files:** B owns `src/storage/export.js` and `tests/export.test.js`; A wires the route; C then owns the download UI changes. These are sequential parts of one task.

- [ ] Export approved JSON/CSV metadata, including settings, timestamps, attempt outcomes/timings, and recovery state; protect against CSV formula interpretation.
- [ ] Check escaping, incomplete/unavailable values, parity with saved records, prohibited sensitive fields, download success, and export failure handling.

**Done when:** Exported evidence agrees with the selected run and downloads work through protected endpoints. **Coverage:** F-04/F-07.

### R14: Combined quality gate

**Proposed files:** `tests/end-to-end.test.js`, additional scoped regression tests, and `.github/workflows/checks.yml` only after runnable commands exist.

- [ ] Exercise baseline, each fault, stop/clear, recovery, save/reopen, and export against the combined application.
- [ ] Exercise demo unavailable, storage failure, corrupt records, no observed recovery, unauthorized requests, and shutdown during a fault.
- [ ] Verify logs/records/exports contain no bodies, credentials, or cookies; establish automated checks on PRs using the approved runtime and actual commands.

**Done when:** Applicable [acceptance tests](FaultNet-Architecture-Pack/docs/TESTING.md) pass with recorded commands/environment. Browser checks and limitations are explicit; a green backend suite alone does not mark UI acceptance complete.

### R15-R16: Packet Tracer procedure and evidence

**Proposed files:** `labs/packet-tracer/README.md`, approved `.pkt` topology, reviewed observations/screenshots.

- [ ] R15: Define the approved topology/protocol scenarios, repeatable steps, expected observable behavior, tool version, and evidence checklist. Do not assume RIP/OSPF coverage before R01.
- [ ] R16: Execute available GUI steps, record actual observations and limitations, and review evidence before committing it.

**Done when:** Another operator can reproduce the procedure and distinguish simulated observations from application measurements. If execution is unavailable, keep R16 blocked and report the missing evidence. **Coverage:** F-06 simulation.

### R17-R18: Wireshark procedure and evidence

**Proposed files:** `labs/wireshark/README.md`, reviewed observation tables/screenshots; raw captures remain outside Git.

- [ ] R17: Verify availability/permissions, identify the appropriate demo-traffic interface and filters, define synthetic capture steps, and explain which metrics the capture supports.
- [ ] R18: Capture the approved application scenarios, record timestamps/tool environment and real observations, and review privacy before sharing sanitized evidence.

**Done when:** Claims are traceable to observed packets and limitations; HTTP failures are not presented as packet-loss rates. If capture is unavailable, keep R18 blocked and report the limitation. **Coverage:** F-06 capture.

### R19: Two-laptop portability

**Owns:** A's setup documentation and cross-laptop check records; no machine credentials are committed.

- [ ] Each laptop checks out the same reviewed commit using its own access, follows the actual setup/start/test instructions, and performs a baseline/fault/stop smoke check.
- [ ] Verify safe handling of occupied ports, different local paths, missing tooling, and local-only results; record runtime/browser versions and check outcomes per laptop.
- [ ] Demonstrate one handoff: one agent pushes its code/context, another pulls the matching SHA and identifies the correct next task without prior chat history.

**Done when:** Both active environments have recorded evidence, or remaining failures are clearly open blockers. One successful laptop does not imply both pass. The inactive third laptop is excluded.

### R20: Report and release checkpoint

**Proposed files:** `docs/report.md`, `docs/demo.md`, plus A's README/specification/roadmap/handoff updates. Report format follows the confirmed course rubric.

- [ ] Map F-01 through F-07 to verified features and evidence; preserve source labels, settings, limitations, and unsuccessful runs where relevant.
- [ ] Provide a short repeatable demo: baseline, delay, bandwidth restriction, interruption, stop/recovery, saved result, export, and separate lab evidence.
- [ ] Review the final diff and combined checks, push the reviewed release commit, verify its remote SHA, and record outstanding limitations. Public deployment remains excluded.

**Done when:** A fresh agent/operator can reproduce the demo from the final commit and the report claims no unperformed tests or missing lab evidence as complete.

## Definition of done for every application task

1. Read the task's dependencies, frozen contracts, actual files, and current handoff; verify ownership before editing.
2. Add a meaningful failing test for nontrivial new behavior, implement the smallest correct change, and show the test passes. Fixes retain a useful regression test.
3. Run the task's scoped checks and affected integration checks using configured commands; capture exact commands, environment, results, and skipped checks.
4. Review inputs, cancellation, cleanup, data-loss paths, accessibility where applicable, and compliance with the task's file boundary.
5. Commit/push the task branch, obtain review where assigned, and verify the remote SHA. A updates task status and shared context after authorized integration.

Do not mark a task Done because its code exists or its author says it works. Evidence, contract compatibility, and integration are required.

## Dependency order and safe parallelism

- Begin with R01. Then R02, R03, and R04 can be assigned independently if their paths/contracts are disjoint.
- R05 and R06 can proceed after the demo contract is available. R07 and R08 both modify proxy behavior, so run them sequentially unless R01 deliberately separates their file ownership.
- R09 and R10 integrate the backend. C may prepare approved UI structure after R01, but R11 acceptance requires the real R10 API; mocks do not prove integration.
- R15 can proceed alongside application work once lab requirements are approved. R17 depends on a runnable demo/proxy; final capture evidence waits for R14.
- R14 and R19 verify the combined product. R20 waits for both application and lab evidence; tool availability is not a reason to silently omit F-06.

## Task handoff template

Put this in a task PR description, or in HANDOFF.md for sequential work; agents fill it in.

```text
Task ID and status:
Laptop / branch / base contract commit:
Owned files and interfaces consumed/produced:
Completed behavior and decisions used:
Checks: exact command/procedure -> result, environment:
Failures, skipped checks, and local-only evidence:
Remote branch and pushed SHA:
Shared-file changes requested from A:
Next action and dependencies for the receiving agent:
Reviewer / integration status:
```

For a commit's own SHA, use the PR/final transfer message rather than inserting it into a file inside that commit. Keep credentials and private chat transcripts out of handoffs.
