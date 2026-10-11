# Product Requirements Document

## Concrete proposals for review
[Implementation contracts](../../docs/implementation-contracts.md#measurement-protocol) now proposes measurement settings, definitions, safety bounds, and separate lab scenarios for roadmap R01. These choices remain pending approval; the approved scope and open course/tool questions below are preserved.

## Project context
- Product: FaultNet.
- Owner: Project owner/user.
- Status: Approved documentation baseline. Approved choices, proposals, and unresolved details remain distinguished; documentation approval does not authorize application implementation.
- Problem: The project investigates how unreliable networks affect web application availability, performance, and recovery.
- Target users: A student lab operator. Instructors review exported results and supporting evidence.
- Desired outcome: Reproducible comparisons between normal, faulty, and recovery conditions, with network observations distinguished from application measurements.
- Reference: https://github.com/Rohith-JN/chaos-proxy — conceptual inspiration only; its code and stack are not adopted.

## MVP scope
- Must ship:
  - Local web dashboard and a small demo web server.
  - Baseline experiments.
  - Proxy-induced delay, bandwidth restriction, and connection interruption.
  - Baseline/fault/recovery comparisons.
  - Local JSON records and JSON/CSV export.
  - Separately documented Packet Tracer and Wireshark experiments.
- Explicitly excluded:
  - Public deployment, multi-user accounts, tenant management, arbitrary external targets, and production traffic.
  - Genuine IP packet-loss injection in the first MVP.
  - Automatic integration between Packet Tracer and the real application.
  - Automatic capture or analysis of Wireshark files.
  - Copying the reference implementation.
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
The following acceptance criteria are recorded in the approved document pack. Numeric protocols and implementation details remain unresolved where identified.

| ID | User need | Behavior | Acceptance criteria | Priority |
| --- | --- | --- | --- | --- |
| F-01 | Establish normal behavior | Probe the fixed demo server without injected faults | Given a reachable demo server, a completed baseline shows settings, attempt outcomes, and timings; an unreachable server produces an explicit error | Must |
| F-02 | Investigate faults | Apply delay, stream bandwidth restriction, or connection interruption | Each supported fault can be selected and cleared; applied settings are recorded; effects are checked against the configured values and tolerances | Must |
| F-03 | Observe recovery | Compare baseline, faulty, and post-fault probes | Clearing the fault is timestamped; recovery observations are shown; failure to recover within the observation window is reported without a fabricated recovery time | Must |
| F-04 | Compare and report | Display phase results and export JSON/CSV | Exports retain settings, timestamps, outcomes, timings, and recovery observations; incompatible runs are flagged | Must |
| F-05 | Retain evidence | Save local JSON records until manually deleted | A saved record can be reopened; failed writes are reported; no automatic expiration occurs | Must |
| F-06 | Support course analysis | Document separate Packet Tracer/Wireshark experiments | Evidence identifies its source, topology/environment, procedure, and observations; simulated measurements are never presented as real application measurements | Must |
| F-07 | Recover from UI and permission errors | Show explicit states and enforce local control boundaries | Loading, empty, error, stopped, and populated states are visible; prohibited requests cannot change configuration or access results | Must |

## Success measures
- Measure application request outcomes, elapsed time, delivered throughput, and observed recovery.
- Measure RTT and retransmissions only through an appropriate network observation method.
- Do not infer IP packet loss from failed HTTP requests.
- Proposed availability definition: Successful non-cancelled attempts divided by all non-cancelled attempts; no attempts yields an unavailable value, not zero.
- Proposed successful attempt: Expected HTTP response with a complete body. Exact demo response contract remains unresolved.
- Proposed recovery definition: The first configured number of consecutive successful probes after fault removal, within a configured observation window.
- Probe counts, intervals, timeouts, payload sizes, recovery count/window, timing tolerances, and percentile calculation are unresolved.
- No performance improvement, accuracy target, or test result is claimed.
- Accessibility criteria are proposed in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

## Open decisions
- Measurement protocol and numeric safety limits — owner: Project owner; needed before experiment implementation.
- Exact Packet Tracer scenarios and RIP/OSPF coverage — owner: Project owner; needed before lab procedures are finalized.
- Wireshark availability and capture privileges — owner: Project owner; needed before capture exercises.
- Deadline interpretation and course rubric — owner: Project owner; needed before release planning.
- API/schema proposals and visual details — owner: Project owner; needed before affected implementation.

## Definition of ready
Approved scope and document acceptance criteria are recorded. Blocking unknowns are resolved before the affected implementation. Documentation approval does not authorize application implementation.
