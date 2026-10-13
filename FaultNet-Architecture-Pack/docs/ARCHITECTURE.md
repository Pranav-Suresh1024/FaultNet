# Architecture

## Approved application contracts
The user resumed implementation on 12 October 2026 after reviewing the [implementation contracts](../../docs/implementation-contracts.md). Application contracts are approved; lab choices remain proposals. Current verification is in [HANDOFF.md](../../HANDOFF.md).

## System purpose
Implement [PRD F-01 through F-07](PRD.md#feature-specifications) as a local resilience lab. The application portion exists on task/faultnet-mvp; separate lab evidence and release remain pending.

## Stack and boundaries
- Node.js 22.23.1, ES modules, built-in HTTP/filesystem/crypto/test facilities; no third-party packages.
- Plain browser HTML/CSS/JavaScript. One process, four listeners explicitly bound to 127.0.0.1.
- Cockpit/control on port 3000; workbench at /workbench; fixed demo on 3001; experiment proxy on 3002; live proxy on 8080. Canonical control URL uses the numeric host.
- Demo GET /payload returns status 200 and 65,536 synthetic F bytes. The experiment proxy supports only this fixed target/path/method; the live proxy supports protected configurable development origins and streaming HTTP requests.
- Local schema-v1 JSON records under results/, excluded from Git. No database service or account system.
- No public deployment, unconfigured forward proxying, production traffic, genuine IP packet-loss injection, or automated lab integration. Live configuration follows the [13 October extension](../../docs/implementation-contracts.md#live-proxy-extension--13-october-2026).

## Request and data flow
1. Dashboard obtains an in-memory capability and sends protected same-origin API requests.
2. Control validates the canonical routed path, Host, Origin, capability, settings, methods, and resource limits.
3. Runner probes the proxy, which forwards only to the fixed demo server.
4. Comparison runs execute baseline, fault, fault clearance, and recovery; baseline-only runs skip fault/recovery.
5. Records save before start acceptance, at phase boundaries, and terminal cleanup.
6. Dashboard displays selectable phase summaries, measured charts/statistics, exact probes, incomplete/unsaved state, compatible comparisons and protected downloads. Browser scenarios/results/charts modules handle presets, derivation and SVG rendering. The workbench does not alter HTTP APIs or record semantics.

Control traffic stays separate from impaired demo traffic. Actual HTTP elapsed time is not RTT. Packet Tracer simulation and Wireshark observations are independent evidence sources.

## Interfaces
Implemented experiment routes are defined by the [API contract](../../docs/implementation-contracts.md#api-contract); live routes/configuration by the extension above. GET /api/session issues the per-process capability; all other APIs require it. Experiment APIs accept no caller-selected URL/filesystem path. Live target origins are configured only through protected control, resolved/checked once per request and pinned to the checked address.

Live requests snapshot applied configuration, choose a unified/split origin or injected/mock response, stream body data with bounded chunks/backpressure, apply response effects and append a private bounded activity entry. Apply changes new requests; Reset cancels existing requests. Both live configuration and monitor remain in memory, isolated from the persistent runner.

## Project structure
- public/: Dashboard assets, served through an explicit allowlist.
- public/protocol.js: Pure conservative budget formula/limit shared by the browser and server validator; contains no session or server-only data.
- src/control/: HTTP API, security, and settings validation.
- src/experiments/: Probes, summaries, lifecycle/cancellation.
- src/proxy/ and src/demo/: Controlled traffic and fixed synthetic server.
- src/live/: Validated live configuration, DNS/target boundary, streaming faults and bounded memory traffic window.
- public/live.html, live.css, live.js, live-model.js: Cockpit, control orchestration, presets and traffic derivation.
- src/storage/: Validated JSON records and exports.
- src/app.js and src/main.js: Startup and shutdown.
- tests/: Built-in Node tests with temporary storage and ephemeral ports.
- docs/: Approved contracts and implementation ledger.
- FaultNet-Architecture-Pack/docs/: These seven companion specifications.
- labs/: Future separate procedures/evidence; not yet populated.

## Operations
Run npm start from the Git root. Port/init failure closes already opened listeners and reports an error. Stop/shutdown cancels probing, clears held proxy work, saves terminal evidence, and closes listeners. Failed saves are reported; no silent successful shutdown with retained unsaved evidence.

One active experiment, no hidden retries, 120-second probing deadline. Refer to contracts for all numeric limits. A crash may lose observations since the last phase save; restart labels active saved records interrupted.

## Open work
Packet Tracer topology/routing requirements, Wireshark access, deadline/rubric, other-laptop verification, and release acceptance remain unresolved. Node 24 compatibility is unverified.
