# Product Requirements Document

## Approved application contracts
The user resumed implementation on 12 October 2026 after reviewing the [implementation contracts](../../docs/implementation-contracts.md#measurement-protocol). Application settings, definitions, safety bounds, API/schema, and UI choices are approved. Separate lab scenarios remain proposals; course/tool questions remain open. Current evidence is in [HANDOFF.md](../../HANDOFF.md).

## Project context
- Product: FaultNet.
- Owner: Project owner/user.
- Status: Application implemented on task/faultnet-mvp under the user's resume request; validation/review and separate lab/release gates are recorded in the handoff and roadmap.
- Problem: The project investigates how unreliable networks affect web application availability, performance, and recovery.
- Target users: A student lab operator. Instructors review exported results and supporting evidence.
- Desired outcome: Reproducible comparisons between normal, faulty, and recovery conditions, with network observations distinguished from application measurements.

## MVP scope
The user requested a live proxy expansion on 13 October. [Updated contracts](../../docs/implementation-contracts.md#live-proxy-extension--13-october-2026) supersede the original product's demo-only target boundary. The fixed experiment workflow below remains available; the independently implemented live cockpit adds configurable development targets and real traffic controls.

- Must ship:
  - Local web dashboard and a small demo web server.
  - Baseline experiments.
  - Proxy-induced delay, bandwidth restriction, and connection interruption.
  - Baseline/fault/recovery comparisons.
  - Local JSON records and JSON/CSV export.
  - Separately documented Packet Tracer and Wireshark experiments.
- Explicitly excluded:
  - Public deployment, multi-user accounts, tenant management, unconfigured forward proxying, and production traffic.
  - Genuine IP packet-loss injection in the first MVP.
  - Automatic integration between Packet Tracer and the real application.
  - Automatic capture or analysis of Wireshark files.
  - Adopting external implementation source.
- Constraints:
  - Windows-first web application.
  - All application coding performed by agents.
  - Node.js backend and plain HTML/CSS/JavaScript frontend.
  - Cisco Packet Tracer is installed locally.
  - Deadline supplied: Tuesday, 11:59 p.m.
  - Working deadline interpretation: 13 October 2026, 11:59 p.m. IST. Exact date/timezone confirmation remains unresolved.
  - Wireshark installation, capture permissions, budget, and grading rubric are unresolved.

## User journeys
1. Baseline:
   - Actor: Local lab operator.
   - Trigger: Start a normal-condition experiment.
   - Steps: Confirm demo-server readiness, choose experiment settings, run probes, inspect results.
   - Result: A labeled baseline record.
   - Failure/recovery: Unreachable server or storage failure is displayed explicitly; unsuccessful attempts remain visible.

2. Fault and recovery:
   - Actor: Local lab operator.
   - Trigger: Investigate one fault type.
   - Steps: Run a baseline, apply a supported fault, run the faulty phase, clear the fault, observe recovery.
   - Result: Comparable measurements with the applied configuration recorded.
   - Failure/recovery: The operator can stop the experiment and restore normal forwarding.

3. Review and export:
   - Actor: Local lab operator; instructor receives exported evidence.
   - Steps: Select results, compare phases, export JSON/CSV.
   - Result: Labeled evidence suitable for a course report.
   - Failure/recovery: Missing, corrupt, or incomplete records are identified rather than silently omitted.

4. Network lab:
   - Actor: Student lab operator.
   - Steps: Execute a documented Packet Tracer or Wireshark procedure and record its environment, observations, and limitations.
   - Result: Separate network evidence.
   - Failure/recovery: Unsupported tools or unavailable permissions are recorded as limitations.

## Feature specifications
The following acceptance criteria use the approved concrete application contracts. F-06 still requires separate verified lab evidence.

| ID | User need | Behavior | Acceptance criteria | Priority |
| --- | --- | --- | --- | --- |
| F-01 | Establish normal behavior | Probe the fixed demo server without injected faults | Given a reachable demo server, a completed baseline shows settings, attempt outcomes, and timings; an unreachable server produces an explicit error | Must |
| F-02 | Investigate faults | Apply delay, stream bandwidth restriction, or connection interruption | Each supported fault can be selected and cleared; applied settings are recorded; effects are checked against the configured values and tolerances | Must |
| F-03 | Observe recovery | Compare baseline, faulty, and post-fault probes | Clearing the fault is timestamped; recovery observations are shown; failure to recover within the observation window is reported without a fabricated recovery time | Must |
| F-04 | Compare and report | Display phase results and export JSON/CSV | Exports retain settings, timestamps, outcomes, timings, and recovery observations; incompatible runs are flagged | Must |
| F-05 | Retain evidence | Save local JSON records until manually deleted | A saved record can be reopened; failed writes are reported; no automatic expiration occurs | Must |
| F-06 | Support course analysis | Document separate Packet Tracer/Wireshark experiments | Evidence identifies its source, topology/environment, procedure, and observations; simulated measurements are never presented as real application measurements | Must |
| F-07 | Recover from UI and permission errors | Show explicit states and enforce local control boundaries | Loading, empty, error, stopped, and populated states are visible; prohibited requests cannot change configuration or access results | Must |
| F-08 | Customize and inspect experiments | Editable scenario presets, saved-run reuse, phase selection, probe/distribution/outcome visuals and fuller statistics | Controls do not silently start runs or mutate evidence; successful timings and all-attempt outcomes remain distinct; missing values stay unavailable | Approved 13 Oct |
| F-09 | Test live development applications | Unified/split routing, delay/jitter, bidirectional limits, connection modes, status/header/mock rules | Protected Apply/Reset changes real forwarding; reset cancels active work; validate targets/inputs and retain the fixed workbench | Requested 13 Oct |
| F-10 | Inspect live traffic | Latest 50 memory entries, window statistics/duration bars, filters, clear and sample GET | Show actual outcome/time/bytes/fault labels, exclude queries/bodies/secrets, distinguish process memory from saved experiments | Requested 13 Oct |

## Success measures
- Measure application request outcomes, elapsed time, delivered throughput, and observed recovery.
- Measure RTT and retransmissions only through an appropriate network observation method.
- Do not infer IP packet loss from failed HTTP requests.
- Availability: Successful non-cancelled attempts divided by all non-cancelled attempts; no eligible attempts yields null.
- Success: Status 200 and complete 65,536-byte synthetic F body.
- Recovery: Three consecutive complete successes after clearance within 15 seconds; no confirmation yields null duration.
- Counts, intervals, timeouts, limits, median/p95 formulas, and calibration tolerances follow the approved [measurement protocol](../../docs/implementation-contracts.md#measurement-protocol).
- Local test/calibration observations are recorded in HANDOFF.md; no performance improvement or general accuracy claim is made.
- Accessibility requirements follow [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md); compliance requires rendered verification.

## Open decisions
- Exact Packet Tracer scenarios and RIP/OSPF coverage — owner: Project owner; needed before lab procedures are finalized.
- Wireshark availability and capture privileges — owner: Project owner; needed before capture exercises.
- Deadline interpretation and course rubric — owner: Project owner; needed before release planning.

## Definition of ready
The application scope/contracts are approved and implementation is resumed. Resolve outstanding lab/rubric/tool questions before their affected tasks. Approval does not authorize public deployment or fabricated lab evidence.
