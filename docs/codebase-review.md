# Codebase review and proposed improvements

Reviewed 12 October 2026 against task/faultnet-mvp at 675ce81. This branch adds the requested Packet Tracer artifacts and documentation; the application logic is unchanged. These application changes are recommendations, not implemented features.

## What the application does

FaultNet is a local resilience teaching lab. One Node.js process starts three loopback-only services: the dashboard/control API on 3000, a fixed synthetic demo on 3001, and a proxy on 3002. The demo returns 65,536 F bytes. The proxy can add response delay, restrict response bandwidth, or interrupt the connection. It cannot target arbitrary external systems.

The runner collects baseline, faulty, and recovery HTTP probes (or baseline only), applies one fault, clears it, and looks for three consecutive complete successes within 15 seconds. It supports one experiment at a time, cancellation, and a 120-second probing deadline. The dashboard shows phase summaries and saved-run comparisons; JSON/CSV exports preserve settings, observations, and missing values. Records use validated local schema-v1 JSON and atomic replacement. Startup labels incomplete saved runs interrupted.

The module split is appropriate for this scope: src/control handles API/security/settings, src/experiments handles probes/metrics/lifecycle, src/proxy and src/demo handle traffic, src/storage handles records/exports, and public handles presentation. The application uses Node built-ins and plain browser JavaScript. The fixed target, separate control path, cancellation cleanup, explicit failed saves, Origin/capability checks, and honest measurement labels are good foundations.

Packet Tracer .pkt projects are separate simulations. This branch supplies static routing, RIPv2, and OSPF reachability/failover evidence under labs/packet-tracer. There is no automatic simulator telemetry ingestion, and the app's HTTP failures are not IP packet-loss measurements.

## Prioritized changes

| Priority | Recommendation | Reason and implementation direction |
| --- | --- | --- |
| First | Fix clearing the saved-run selection | public/app.js:121 only acts when the selected ID is nonempty. Selecting the placeholder leaves the previous record and exports active. Clear selected, phase/comparison output, recovery text, and export buttons; retain selectionVersion protection. Add a regression covering a delayed fetch followed by clearing. Define whether an active run continues to display independently. |
| First | Improve preflight feedback for experiment settings | The backend rejects unsafe budgets in src/control/validation.js:35, but the UI gives a generic settings error. Show estimated maximum duration and explain when count × timeout × phases exceeds 120 seconds. Warn when 64 KiB / rate exceeds timeout. Keep server validation authoritative and do not silently clamp settings. |
| Next | Add per-probe outcomes and a small phase timeline | The saved observations contain much more detail than the phase table shows. A plain SVG elapsed-time plot plus an accessible table would expose transient failures and recovery, with a failed/cancelled marker and sample count. Do not plot missing timing as zero or label HTTP elapsed time RTT. |
| Next | Add a repository evidence panel and correct the footer | public/index.html still calls both evidence tasks pending. The Packet Tracer labs now exist. Provide a clear manual link/reference to the three scenarios and their verification notes, and label Wireshark pending separately. The schema already allows evidenceReferences, but no API/UI currently attaches them. A read-only lab catalog is the smaller first step. |
| Next | Recover gracefully after a server restart or temporary disconnect | The capability changes on restart. The current dashboard requires reload after token failure and a manual refresh after idle connection failure. Offer a reconnect action that reacquires the session capability, verifies readiness, and preserves the selected run ID without silently retrying Start/Stop mutations. |
| Later | Reduce full history reads as archives grow | Every active refresh calls history; listRecords reads and validates every saved JSON file. Keep live status/results polling, but refresh history only when runs finish or the operator requests it, then consider bounded pagination/indexing if archives grow. Measure before adding a database. |
| Later | Consider more frequent bounded checkpoints | Current phase-boundary persistence can lose in-phase observations after a hard crash. If that matters for the rubric, add a bounded checkpoint interval or per-probe saving and test crash/restart plus write failures. This changes the approved persistence contract and should be recorded explicitly. |

Avoid expanding into accounts, public deployment, arbitrary external targets, a frontend framework, or a database for this MVP. Those changes add cost without helping the present local teaching workflow.

## Review evidence

- Inspected source, tests, seven architecture specifications, implementation contracts, handoff, and roadmap. The corrected Desktop archive's application files match the fetched application branch.
- Fresh checkout npm test on Windows / Node 24.14.1: 26 passed, 0 failed, about 17.8 seconds. Calibration recorded a 510.7 ms median delay increase and 31.98/31.79/31.88 KiB/s goodput for the 32 KiB/s test.
- A temporary Node VM/controlled DOM observation selected a saved record and then cleared the selector. The old run remained displayed, and JSON/CSV exports remained enabled. That reproduces the first recommendation; the observation was removed after review rather than committed as a test that endorses the defect.
- Current reference runtime is Node 22.23.1. Node 24 results are additional compatibility evidence; a fresh current-branch reference-runtime CI run must be checked separately.
- Earlier handoff browser observations are historical. This review does not certify all keyboard/reflow/accessibility paths or other laptops.
- Packet Tracer live results are in labs/packet-tracer/LIVE-VERIFICATION.md. Wireshark evidence, three-laptop verification, rubric/deadline confirmation, and final release remain separate gates.

The supplied MCP source was also inspected: domain/planner/validation, generators, transports, tool registry, extension, tests, and docs. Earlier planning/generator tests passed 22/22 and a wider available subset passed 480/480; full-suite collection then lacked mcp and required a pyreadline compatibility shim. The package was later installed and used successfully for the live lab, but a full MCP suite was not rerun. The MCP source itself is not vendored into this repository.
