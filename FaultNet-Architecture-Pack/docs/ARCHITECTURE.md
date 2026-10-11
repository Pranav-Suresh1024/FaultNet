# Architecture

## System purpose
Implement the local FaultNet workflow defined in [PRD.md](PRD.md): Run controlled application experiments, compare phases, retain results, and document separate network simulations and captures.

## Stack decisions
| Layer | Selected technology | Reason | Constraints |
| --- | --- | --- | --- |
| Frontend | Plain HTML/CSS/JavaScript | Approved simple dashboard | No frontend framework approved |
| Backend/API | Node.js | Approved Windows-first backend | Version and packages unresolved |
| Storage | Local JSON files | Approved local data policy | Schema and storage directory proposed/unresolved |
| Authentication | No accounts | Approved single local operator | Does not eliminate authorization or browser-origin protections |
| Hosting | Local Windows machine | Approved local workflow | Loopback-only controls; no public deployment |
| Network simulation | Cisco Packet Tracer | Approved separate network lab | Installed locally; version and topology unresolved |
| Packet observation | Wireshark | Intended separate evidence source | Installation and capture privileges unresolved |

## System boundaries
- Client owns: Presentation, operator input, status display, comparison, and export interaction.
- Server owns: Input validation, control authorization, fixed-target enforcement, experiments, measurement, and result storage.
- Demo server owns: A controlled response used by experiments.
- Fault proxy owns: Approved delay, stream throttling, and interruption behavior for the demo target.
- Packet Tracer owns: Separate simulated topology and protocol observations.
- Wireshark owns: Separate capture-based evidence.
- Out of scope: Arbitrary targets, public control APIs, account systems, real IP packet-loss injection, and automatic Packet Tracer integration.

## Request and data flow
Proposed topology:
1. Dashboard sends same-origin control requests to the Node.js control server.
2. Server validates the request and enforces local control restrictions.
3. Experiment probes pass through the fault proxy to the fixed demo server.
4. Results distinguish transport outcomes, HTTP responses, phase, and injected settings.
5. Server writes approved metadata to local JSON records.
6. Dashboard displays results or an explicit failure state.
7. Fault removal starts the defined recovery-observation phase.

The dashboard/control path must remain usable while the demo traffic is impaired.
Packet Tracer and Wireshark evidence remains separate and explicitly labeled.

## Interfaces
Proposed API; no routes currently exist:
- GET /api/status: Demo/control readiness and experiment status.
- POST /api/experiments: Validate settings and start an experiment.
- POST /api/experiments/{id}/stop: Stop probes and clear applicable faults.
- GET /api/experiments: List available records.
- GET /api/experiments/{id}: Read one record.
- GET /api/experiments/{id}/export?format=json|csv: Export approved fields.

Proposed error categories:
- Invalid input.
- Prohibited request or target.
- Experiment already running.
- Unknown record.
- Demo server unavailable.
- Storage/export failure.

Exact request/response shapes, status codes, identifier rules, and repeated-stop behavior remain unresolved. No arbitrary target URL or filesystem path is accepted.

Proposed jobs:
- One active experiment at a time.
- No automatic probe retries unless the measurement protocol explicitly includes and records them.

## Project structure
The inspected project archive is empty. The following structure is proposed:
- public/: Dashboard assets.
- src/control/: API and local-control validation.
- src/experiments/: Experiment lifecycle and measurement.
- src/proxy/: Fault behavior.
- src/demo/: Controlled demo server.
- src/storage/: JSON persistence and export.
- tests/: Automated checks.
- results/: Local generated records.
- labs/: Packet Tracer/Wireshark procedures and evidence references.
- docs/: Seven companion documents.
- AGENTS.md: Root agent guidance.

Only AGENTS.md and the seven docs are supplied by this pack. Application directories and files have not been created.

## Operations
- Environment: Local development/lab only.
- Ports, Node.js version, startup order, and configuration names: Unresolved.
- Faults default to disabled; detailed shutdown/cleanup behavior is proposed.
- Proposed limits: One active experiment, bounded duration/concurrency/payloads, and explicit cancellation.
- Logs must avoid sensitive bodies, credentials, cookies, and unrestricted URLs.
- Installation, development, build, and startup commands: Not configured.
- Deployment and rollback: Not configured; public deployment is outside the MVP.

## Decisions and unknowns
Confirmed:
- Windows-first, Node.js, plain web UI, local JSON.
- Single local operator with no accounts.
- Loopback-only controls and demo-only fault injection.

Proposed:
- Component separation, directory structure, API, and one-experiment concurrency.

Unresolved:
- Numeric limits, ports, versions, dependencies, complete API contract, and measurement protocol.
- Owner: Project owner/user.
