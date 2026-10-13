# FaultNet implementation contracts

**Status: Application contracts approved; implementation resumed 12 October 2026.** The user asked to start implementation after the technical proposal was presented. That request approves proceeding with these application choices and supersedes the roadmap preparation pause. Lab scenarios below remain proposals; rubric/tool questions gate their affected tasks. Current implementation and validation are in [HANDOFF.md](../HANDOFF.md).

Read with [roadmap.md](../roadmap.md) and the [architecture pack](../FaultNet-Architecture-Pack/AGENTS.md). All agents use these application contracts and update affected documents before changing them. The live extension below supersedes the earlier demo-only product boundary; fixed experiment and record contracts remain unchanged.

## Live proxy extension — 13 October 2026

The user requested a close functional/visual live proxy cockpit and removal of reference names from current files. This is implementation authorization on the existing application branch; independent FaultNet source is used. The [design](superpowers/specs/2026-10-13-live-proxy-design.md) records implementation decisions under that request, and the [plan](superpowers/plans/2026-10-13-live-proxy.md) records acceptance checks. Historical Git commits are retained.

- Four loopback listeners: control 3000, demo 3001, fixed experiment proxy 3002, live development proxy 8080. `/` serves the cockpit; `/workbench` retains the dashboard. No schema migration, package or lab merge.
- Live configuration supports unified/split HTTP/HTTPS development origins, backend prefixes, both-direction delay/bandwidth, jitter, four connection modes, status probability rules, header controls and JSON mocks. Exact bounds/precedence/cancellation are in the design; these rules do not change experiment measurements.
- GET/POST `/api/live/config` returns `{config}` (GET also returns `proxyUrl`). GET `/api/live/activity` returns `{entries,activeCount}`. POST `/api/live/reset` and `/api/live/activity/clear` expect `{}`. POST `/api/live/probe` expects `{path}` and returns `{status,bytes,elapsedMs,outcome}` with a five-second ceiling. Existing capability/Origin/Host/8192-byte/rate protections apply.
- Live targets are origin URLs without URL credentials, paths, queries or fragments. Validate resolved addresses, forbid protected local listener ports/metadata/unspecified/multicast addresses, and pin the checked DNS result for the outgoing connection. No automatic redirects, CONNECT, WebSocket proxying, public listeners or production traffic.
- Configuration and latest 50 finished requests are process memory only. Apply affects new requests; Reset retains applied targets/routes, clears faults/rules, discards drafts and cancels live work. Restart restores the local demo and clears live history. Persistent experiment files are unchanged.
- Monitor records method, pathname, status, elapsed milliseconds, bytes, outcome and fault labels. Queries, bodies, credentials, cookies, tokens and target URLs are excluded. Pathnames themselves can contain sensitive application identifiers; use synthetic/development traffic and review before sharing a screenshot.

## Recommended approach

Use Node.js built-in HTTP, filesystem, crypto, timing, and test facilities, with plain browser pages. A single Node process owns four separate loopback listeners, the experiment lifecycle, and safe local persistence. This gives a reproducible local lab without package dependencies.

Separate operating-system processes would isolate failures more strongly but add startup/cleanup coordination. A web framework and frontend framework would add dependencies without providing a required MVP feature. Neither alternative is recommended for this first version.

## Runtime and startup

- Reference runtime: Node.js **22.23.1**, observed on the current Windows laptop; record it in a committed `.node-version`. Other laptops install/use the same reference runtime. Node 24 compatibility may be checked later; it is not assumed.
- JavaScript ES modules (`type: module`), semantic HTML, plain CSS, browser JavaScript. No third-party runtime or test packages initially.
- Configured scripts: `npm start` -> `node src/main.js`; `npm test` -> `node --test`. Both have been executed locally. package-lock.json is committed with zero external dependencies; package downloads are unnecessary.
- Control/cockpit: `http://127.0.0.1:3000`; workbench: `/workbench`; demo: `127.0.0.1:3001`; experiment proxy: `127.0.0.1:3002`; live proxy: `127.0.0.1:8080`. All listeners bind explicitly to `127.0.0.1`. Controls use the canonical numeric host; `localhost` is not an alternative control Host value.
- Start demo and proxy before exposing ready control services. If any port is occupied or initialization fails, report the error and close already-started listeners. Do not terminate other programs or silently choose another public port.
- Automated tests use ephemeral local ports and temporary storage via internal test parameters, not user-selectable target URLs or paths.
- On normal shutdown, stop the experiment, cancel timers/probes, clear faults, close sockets/listeners, and await the final save. After a hard process crash, startup converts persisted active states to `interrupted` and records missing observations explicitly; faults always start disabled.

## Fixed demo and fault behavior

- The demo accepts only `GET /payload`, returning status 200, `Content-Type: application/octet-stream`, `Content-Length: 65536`, and 65,536 synthetic `F` bytes. Contract identifier: `faultnet-demo-v1`. No compression or redirects.
- Probes always request `/payload` through the local proxy. The proxy forwards only that route/method to the fixed demo listener. No absolute URL, target field, CONNECT tunneling, external host, or caller-supplied path is supported.
- A successful probe receives the expected status, complete matching synthetic body, and byte count before its timeout. Compare synthetic bytes in memory; never persist response bodies.
- Faults are mutually exclusive per experiment; no combinations in the MVP. Baseline and recovery use `{type: "none"}`.
- Delay fault: wait `delayMs` once before forwarding the request; cancellation clears the wait.
- Bandwidth fault: cap response-body delivery at `rateKiBps * 1024` bytes/second. Schedule at most 1 KiB chunks at evenly spaced monotonic deadlines, delaying the first chunk by one chunk interval. Honor backpressure, bound buffering to the known payload, and avoid a busy loop or an initial unbounded burst. This caps payload delivery, not TCP/IP wire rate.
- Interruption fault: destroy the client connection before forwarding, for every faulty-phase probe. Record a connection interruption; never label this IP packet loss.
- Clearing a fault sets normal forwarding and cancels/destroys any remaining fault-held operations. The stop result is terminal only after probes and cleanup settle.

## Measurement protocol

| Setting | Default | Accepted values / bound |
| --- | --- | --- |
| `mode` | `comparison` | `baseline` or `comparison` |
| `probeCount` | 10 per baseline/fault phase | Integer 1-20 |
| `intervalMs` | 250 | Integer 100-2000; wait after one probe completes before the next |
| `timeoutMs` | 3000 | Integer 500-5000; whole-request deadline |
| Payload | 65,536 bytes | Fixed demo payload; not user-configurable |
| Fault selection | Delay | `none` for baseline; `delay`, `bandwidth`, or `interruption` for comparison |
| `delayMs` | 500 | Integer 0-2000, delay fault only |
| `rateKiBps` | 32 | Integer 8-1024, bandwidth fault only |
| Recovery criterion | 3 consecutive successes | Fixed for the first version |
| Recovery observation window | 15,000 ms | Fixed; starts at confirmed fault clearance |
| Active experiments | 1 | Reject competing starts; no queue |
| Experiment duration | At most 120,000 ms | Hard monotonic probing deadline including phases/waits |
| Start/stop JSON body | At most 8192 bytes | Reject oversized input |
| Control API rate | 20 requests/second | Per-second process counter; excess gets 429 before any state change |

- Unknown request fields, wrong types, fractional numbers, nonfinite values, and values outside bounds are rejected. Missing documented settings receive defaults; no silent rounding or clamping.
- A baseline run executes only a fault-free baseline. A comparison executes baseline -> faulty -> clear fault -> recovery. A comparison fault is required after defaults; baseline settings normalize to `fault: {type: "none"}` and reject a supplied non-none fault.
- Each experiment has only one probe in flight. No automatic retry. Before accepting settings, check worst-case budget: baseline `probeCount * (timeoutMs + intervalMs)`; comparison `2 * probeCount * (timeoutMs + intervalMs) + 15000`; reject if above 120000 ms. The bound intentionally overestimates the final wait.
- Reaching the overall probing deadline cancels the active probe, clears faults, and terminates the run as failed with `error.code: "experiment_deadline"`. Cleanup/storage may finish later; report actual endedAt rather than pretending all work completed within the probing budget.
- Preflight demo/storage readiness completes before experiment start, with a 3000 ms demo deadline. Failure rejects the start explicitly, without inventing a completed baseline.
- Recovery ends when three consecutive successes finish inside the window or the window expires. Failed probes reset the streak; probes cannot continue past the window. `confirmedAt` is the end of the third successful probe; recovery duration is confirmation time minus clearance time. Missing confirmation yields `observed: false` and `durationMs: null`.
- A setting can intentionally cause request timeouts, such as a low bandwidth limit. Explain the expected behavior in the UI; do not treat the timeout as proof of packet loss.

### Definitions and summary fields

Each phase summary contains `attemptCount`, `cancelledCount`, `eligibleCount`, `successCount`, `failureCount`, `availability`, `meanElapsedMs`, `medianElapsedMs`, `p95ElapsedMs`, and `meanThroughputKiBps`.

- `attemptCount` counts all begun probes; `eligibleCount = attemptCount - cancelledCount`; `failureCount = eligibleCount - successCount`.
- `availability = successCount / eligibleCount`, stored as a fraction; display as percent. No eligible attempts yields null, not zero.
- Timing summaries use successful completed probes only; retain failed-attempt elapsed timings individually. With no successes, timing summaries are null.
- Mean is arithmetic mean. Median averages the middle two sorted values for even sample counts. P95 uses nearest rank: sorted index `ceil(0.95 * n) - 1`. Display sample counts; ten samples do not justify a strong tail-performance claim.
- Per-success throughput is `bytesReceived / (elapsedMs / 1000) / 1024` KiB/s. Zero measured duration yields null. Mean throughput averages non-null per-success values. This is application payload goodput over whole-request elapsed time, including any delay.
- Store ISO 8601 UTC timestamps for chronology; measure durations/deadlines using monotonic time. Preserve numeric precision in JSON; round only for display.
- Never label request elapsed time as RTT or calculate retransmissions/IP packet loss from HTTP observations.
- Compare phases within a run. For cross-run comparisons require the same schema version, demo contract, mode, probe count, interval, timeout, and recovery criterion/window; show differing fault settings explicitly. Flag incomplete or incompatible runs.

## API contract

All responses are JSON except approved downloads. No CORS access is granted. Unknown routes return 404; known routes with unsupported methods return 405. Validate input before any mutation.

| Route | Success response / behavior |
| --- | --- |
| `GET /api/session` | 200 `{token}`; in-memory random session capability used by the dashboard |
| `GET /api/status` | 200 `{demoReady, storageReady, activeExperimentId, phase, fault}`; nullable ID/phase, disabled fault when idle |
| `POST /api/experiments` | Accept settings; 202 `{experiment}` after initial record is safely saved; execute asynchronously |
| `POST /api/experiments/{id}/stop` | Body `{}` or empty; 202 `{experiment}` while cleanup runs; 200 unchanged terminal record for repeated stop; 404 for unknown ID |
| `GET /api/experiments` | 200 `{experiments, errors}`; newest-first summaries, with corrupt/unsupported files reported explicitly |
| `GET /api/experiments/{id}` | 200 `{experiment}`; current in-memory version for the active/failed-save run, otherwise validated saved record |
| `GET /api/experiments/{id}/export?format=json|csv` | 200 attachment with safe generated filename and appropriate MIME type |

Start settings: `{mode, probeCount, intervalMs, timeoutMs, fault}`. Fault shape is exactly one of `{type: "none"}`, `{type: "delay", delayMs}`, `{type: "bandwidth", rateKiBps}`, or `{type: "interruption"}`; reject fields not belonging to the selected shape. `recoverySuccessCount: 3`, `recoveryWindowMs: 15000`, and `demoContract: "faultnet-demo-v1"` are added to normalized stored settings by the server.

List summary fields: `id`, `createdAt`, `state`, `settings`, `summary`, `recovery`, and `persistence`. List errors contain only nullable validated `id`, `code`, and a safe `message`, never filesystem paths. A valid record with incomplete state is shown with its actual state.

Error shape: `{error: {code, message}}`. Use stable categories: 400 `invalid_input`; 403 `prohibited_request`; 404 `not_found`; 405 `method_not_allowed`; 409 `experiment_busy`; 413 `request_too_large`; 429 `rate_limited`; 503 `demo_unavailable` or `storage_unavailable`; 500 `record_corrupt`, `record_unsupported`, `export_failed`, or `internal_error`. Do not expose stack traces or sensitive paths. List endpoints report per-record errors alongside readable records rather than silently hiding them.

## Local control security

- Validate control Host exactly as `127.0.0.1:3000` (the actual bound numeric port in internal tests). Reject unexpected Host on all routes to reduce DNS-rebinding exposure.
- On all routes, reject an Origin other than the canonical dashboard origin and reject cross-site/same-site Fetch Metadata requests; if `Sec-Fetch-Site` is present, allow only `same-origin` or `none`.
- Issue a 32-byte cryptographically random hex token per process through `/api/session`, with `Cache-Control: no-store`. No account/password system. No token in URLs, logs, records, exports, or persistent browser storage.
- Except `/api/session`, every API request must include `X-FaultNet-Token` matching the current token. Mutations additionally require the exact canonical Origin and JSON content type for non-empty bodies. The dashboard stores the token in memory; exports use fetch with the header and a local blob download.
- A browser from another origin cannot read a session capability via permissive CORS. Reject preflight requests without enabling CORS. CLI tests may access protected reads with a token and no Origin; mutation tests supply the canonical Origin.
- Serve only an explicit dashboard-asset allowlist; do not expose the repository, result directory, source files, or arbitrary paths. Use text-safe rendering, a same-origin Content Security Policy without inline scripts, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, and no-store API responses.
- Bound control header reads to 5000 ms and body reads to 5000 ms; cap simultaneous connections on each listener at 32. Public request inputs never configure internal test ports/storage roots.
- Local privileged/compromised processes remain outside the protection model. The capability prevents untrusted browser origins from controlling experiments; it is not an account credential or a claim of protection from machine compromise.

## Record and persistence contract

- One record at `results/{id}.json`; UUID v4 identifiers generated by the server. Validate identifiers before constructing paths; reject all caller-supplied paths.
- `schemaVersion: 1`. Required fields: `id`, `createdAt`, `startedAt`, `endedAt`, `state`, `settings`, `observations`, `summary`, `recovery`, `persistence`, `error`, and `evidenceReferences`.
- Nullable timestamps until the event occurs. State: `running`, `stopping`, `completed`, `stopped`, `failed`, or `interrupted`. `error` is null or `{code, message}`; evidenceReferences starts as an empty array and may contain reviewed `{source, path, description}` entries, not imported capture data. No evidence-edit API is included.
- Observations: `{phase, startedAt, elapsedMs, outcome, httpStatus, bytesReceived, successful}`. Phase is `baseline`, `faulty`, or `recovery`; byte count is a nonnegative integer; status is nullable; elapsedMs is nullable only when timing is unavailable.
- Outcome: `response_complete` for a full received response (success additionally requires the demo contract); `timeout`; `connection_error` for connection refusal/establishment failure; `interrupted` for reset or premature closure; `cancelled` for user stop/shutdown/deadline cancellation. Preserve fault settings separately; a reset alone does not prove its external cause.
- `summary` has baseline/faulty/recovery phase entries using the fields above. An unattempted phase has zero counts and null metrics.
- `recovery`: `{removedAt, confirmedAt, observationWindowMs, successCountRequired, observed, durationMs}`. Baseline-only runs have null timestamps/duration and `observed: null` (not applicable); comparison runs use `observed: false` until confirmed true.
- `persistence`: `{state, error}` where state is `saved` or `failed`; error is null or a safe error object. A record served from memory after failed save must show failed persistence rather than imply the disk copy is current.
- Write through a unique temporary file in the same directory, flush and close, then replace/rename safely. Preserve the prior valid record if replacement fails. Only publish `saved` after successful write; keep unsaved observations in memory and report the failure.
- Save the initial record before accepting a start, then at phase boundaries and on terminal cleanup. A hard crash may lose the latest unsaved in-phase observations; label the persisted record interrupted on restart. Per-probe crash durability is outside this MVP and must be disclosed.
- A runtime save failure fails/stops the experiment and clears faults; keep the in-memory failed record accessible until process exit. No automatic deletion or expiry.
- Reject corrupt/unsupported records explicitly; do not repair them silently. Validate their structure, bounds, observations, derived summaries, and phase ordering before display/export. Results are local evidence; `.gitignore` exclusion is not a backup.
- Recovery probes require a clearance timestamp and cannot begin before it. Confirmation must match the first three-success streak, ending the recovery observations, and its duration/last completion must match within 2 ms timestamp rounding. Successful probes/confirmation must fit the recovery window; known completion times must fit actual terminal endedAt. Unconfirmed failed/cancelled probes may finish after the scheduled window because timer dispatch can be delayed, but never beyond actual endedAt plus rounding.

## Exports

- JSON exports the validated record, including all observations, normalized settings, summaries, recovery, and persistence/error state.
- CSV uses one row per observation with repeated run/settings/recovery metadata, UTC timestamps, units in column names, and fault parameters. Include run/schema/demo identifiers, counts and summaries, state/error/persistence, and evidence references serialized as JSON text. If no observations exist, emit one metadata row with blank observation fields rather than losing the run metadata.
- CSV column order is fixed: `id, schemaVersion, createdAt, startedAt, endedAt, state, mode, probeCount, intervalMs, timeoutMs, demoContract, faultType, delayMs, rateKiBps, recoveryWindowMs, recoverySuccessCount, removedAt, confirmedAt, recoveryObserved, recoveryDurationMs, persistenceState, errorCode, errorMessage, evidenceReferences, phase, probeStartedAt, elapsedMs, outcome, httpStatus, bytesReceived, successful, attemptCount, cancelledCount, eligibleCount, successCount, failureCount, availability, meanElapsedMs, medianElapsedMs, p95ElapsedMs, meanThroughputKiBps`. Summary cells refer to the observation's phase; the no-observations metadata row uses zero counts and blank metrics/phase. Persistence errorCode/errorMessage are used if no experiment error exists.
- CSV null values are empty cells, quoted fields escape quotes/newlines, and text cells beginning with `=`, `+`, `-`, `@`, tab, or carriage return receive a leading apostrophe to prevent formula interpretation. JSON retains original safe metadata; numeric cells remain numbers.
- No response bodies, credentials, cookies, capability tokens, raw captures, or unrestricted filesystem paths appear in either format.

## Module ownership and interfaces

Use the committed module paths. Logical lanes remain proposed future assignments; the current checkout implements sequentially. Factory-created runner, proxy, and store instances expose these interfaces:

| Owner | Module interface | Contract |
| --- | --- | --- |
| A | Control validation `normalizeSettings(input)` | Return normalized settings or throw categorized invalid_input; never clamp |
| B | Probe `probe({timeoutMs, signal})` | Promise of observation fields without phase; fixed proxy target, no arbitrary URL |
| B | Metrics `summarize(observations)` | Return one phase summary; caller passes only that phase's observations |
| B | Proxy `setFault(fault)` / `clearFault()` | Set validated fault; clearing returns a promise after held work settles |
| B | Records `saveRecord(record)` / `readRecord(id)` / `listRecords()` | Promises; save resolves only after safe persistence; list returns `{records, errors}` |
| B | Export `exportRecord(record, format)` | Return `{content, contentType, filename}` from validated metadata |
| A | Runner `startExperiment(settings)` / `stopExperiment(id)` | Promises of current record; start returns after initial save, not after the whole run |
| A | Runner `getExperiment(id)` | Promise of current in-memory or validated saved record |
| C | Dashboard | Calls frozen HTTP API only; never reads files or imports server modules |

Startup wires shared dependencies once; test fixtures can inject local test resources internally. Do not introduce a generic plugin system, configurable external target, or wrapper layer solely for future flexibility.

## Dashboard proposal

- User-approved redesign on 12 October 2026: [ClipTheme Packet dashboard](https://www.cliptheme.com/demo/packet/LAYOUT-1/#!/app/dashboard) is a visual reference. Use a charcoal sidebar/topbar, light canvas, measured summary cards, phase-median chart, compact settings, saved-run selection, comparison tables, and downloads. Keep one page with real section links; do not copy reference code or introduce its Angular/Bootstrap dependencies.
- Poll active status/results every 1000 ms; pause polling when idle and refresh after user actions. Auto cards show baseline until a faulty attempt exists; the user can select baseline/faulty/recovery explicitly. Recovery duration remains run-level and null unless confirmed. The median chart uses all three stored phase medians; absent values say no successful probes rather than plotting zero.
- Workbench expansion approved 13 October 2026: six editable presets (healthy, mild/severe delay, bandwidth, timeout stress, HTTP outage), selected-run settings reuse, phase-specific probe durations, successful timing distribution, outcome counts, full descriptive statistics and baseline changes. Exact preset values/formulas are in [the approved design](superpowers/specs/2026-10-13-workbench-design.md). No schema or export fields change; derived values remain browser presentation.
- Controls show valid ranges and units. Baseline mode disables fault inputs with an explanation. Stop stays available during running/stopping, and confirmed fault clearance appears only after cleanup.
- Browser and server use public/protocol.js for the same conservative 120000 ms budget formula. The form displays an upper bound and explains excessive settings; correction/preset/reuse recalculates readiness. Comparison/history/selected-record errors stay in their own panels and do not override healthy service readiness; stale success/error responses are ignored.
- Empty, loading, running, stopping, stopped, failed, interrupted, denied, unsaved, incomplete, and populated states have explicit text. Prevent duplicate starts and ignore stale responses when selection changes.
- Approved visual tokens: canvas `#f3f4f7`, surface `#ffffff`, text `#303440`, accent `#b9382c`, muted `#626979`, sidebar/topbar `#2b2e3b`; system UI font with 16 px root and compact component typography. Main content maximum 1500 px plus 216 px desktop sidebar; controls/panels use 4–5 px radii. Stack panels below 950 px, switch sidebar navigation to horizontal links below 768 px. Overflowing tables/charts remain keyboard-scrollable. White focus outlines on the dark sidebar, accent outlines on light surfaces. These values are not an accessibility certification.
- Semantic controls/labels/tables, visible keyboard focus, text with color indicators, restrained polite status announcements, no automatic motion. Contrast, zoom/reflow, keyboard paths, and browser behavior must be checked on the rendered UI.
- Reference browsers: installed Chromium-based Edge/Chrome on Windows; record actual versions during verification. Mobile support is not a release promise.

## Test and evidence protocol

- Use Node's test runner and strict assertions for formula/validation/storage/security tests and real local HTTP integration tests. Use temporary results roots and ephemeral test ports; always close resources.
- Write a meaningful failing test for nontrivial behavior before implementation. Use the committed reference runtime and actual test script. No package/browser download is required. Remote CI execution must be verified separately rather than inferred from a workflow file.
- Delay check: five successful baseline and five 500 ms delayed requests, with identical settings and 3000 ms timeout; median elapsed-time difference should be 400-800 ms on an otherwise idle machine. Record measured values/environment; a failure is investigated, not silently removed or given a wider tolerance.
- Bandwidth check: three successful 65,536-byte probes at 32 KiB/s, whole-request goodput each 24-36 KiB/s, timeout 5000 ms. Verify actual received byte counts; report inability to meet this bound on a busy environment rather than claiming a pass.
- Interruption check: every faulty probe records an incomplete/failed transport outcome; after clear, three full demo responses succeed. Cancellation tests include pending delay, active throttle, interruption, and recovery-window exhaustion.
- Storage/metrics/export checks include empty/cancelled-only runs, incomplete bodies, failed writes, corrupt schemas, CSV-sensitive text, unknown records, and parity between displayed/exported values and observations.
- Security checks cover hostile Host/Origin, missing/wrong token, unsupported methods, unknown fields, malformed/oversized JSON, rate/resource limits, path traversal, and prohibited-target attempts with no side effects.
- Browser verification uses available tools without assuming a installed automation package; if automated tooling is unavailable, record repeatable observational checks and their limitations. Backend tests do not certify the UI.

## Separate network labs and remaining questions

- Proposed Packet Tracer minimum: two small LANs joined by routers; demonstrate a reachable baseline, link disruption, and restoration with ping observations and topology screenshots. Routing uses explicitly documented static routes for the minimum lab. RIP/OSPF comparisons are added only if the owner/course rubric requires them; that decision stays open.
- Proposed Wireshark minimum: synthetic demo/proxy traffic only, using the supported Windows loopback capture interface. Verify installation/capture privileges; compare normal, delayed, throttled, and interrupted application traffic with timestamped observations. Do not derive TCP retransmission/RTT claims unless the actual capture supports them.
- Record versions, interfaces, filters, scenario settings, observations, and limitations in separate lab folders. Raw captures remain outside Git; reviewed sanitized evidence needs deliberate transfer/approval.
- Course rubric, exact deadline, RIP/OSPF requirements, Packet Tracer version, Wireshark availability, and capture privileges remain unverified. They gate affected lab/report tasks; they do not require agents to invent results.

## Laptop coordination status

- The user now reports the teammate is setting up Packet Tracer and has created a separate branch with .pkt files; origin/task/packet-tracer-labs is observed. Remote-laptop application operation and collaborator access have not been verified by this agent.
- For the approved UI update, this checkout owns public/, UI tests, and shared design/context on task/faultnet-mvp. The user explicitly requested staying on this branch; teammate lab work remains on its separate branch. Do not merge or overwrite lab work. Resolve any shared-context conflict during reviewed integration.
- Before handing over, commit/push context and verify the remote SHA; the receiving agent reads current approval status, roadmap ownership, and HANDOFF.md before making changes.
