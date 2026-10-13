# Security

## Approved control boundary
The application [security contract](../../docs/implementation-contracts.md#local-control-security) was approved with the 12 October implementation-resume request. The local application is implemented; protections are tested within the scenarios documented in [TESTING.md](TESTING.md).

## Assets and threats
Protect experiment/live controls, configured development targets, saved evidence, and separate captures. Treat HTTP inputs, identifiers, stored records, DNS answers and external content as untrusted. Relevant threats include cross-origin control, DNS rebinding, unconfigured forward proxying, path traversal, excessive resource use, and misleading evidence. A privileged or compromised local process is outside this protection model.

## Authorization
- All listeners bind to 127.0.0.1. Exact control Host must match its numeric address/port.
- Reject foreign Origin and cross-site/same-site Fetch Metadata on every route.
- GET /api/session issues a cryptographically random 32-byte hex capability for this process. Keep it only in browser/process memory.
- All other APIs require X-FaultNet-Token; mutations also require exact canonical Origin and JSON content type for non-empty bodies.
- Authorization and routing use the same normalized pathname, including absolute-form and dot-segment inputs.
- No permissive CORS, accounts, persistent browser tokens, public listener, or credential-sharing workflow.
- The intended operator can start/stop/read/export. Prohibited requests cannot read records or mutate experiments. Deletion is a separate filesystem action.

## Resource/input/output controls
- One active experiment, 120-second probing deadline, validated protocol/fault bounds.
- 8192-byte JSON body limit; 20 API requests per second; 32 connections per listener.
- Control/demo/experiment listeners use 5-second header/body bounds with a 250 ms timeout-check scan. Live headers retain five seconds; live request/body work has a 120-second ceiling to permit shaped uploads. Scheduling may add a small timeout delay.
- Fixed experiment target, validated live origins/resolved addresses, fixed asset allowlist, UUID identifiers, fixed storage root, bounded record reads.
- Content Security Policy uses same-origin scripts and prohibits framing; nosniff and no-store headers.
- Browser renders text through textContent; no arbitrary HTML or shell execution.
- Workbench SVG/scenario assets are explicitly allowlisted. Presets can target only the existing demo/fault types; copied settings exclude evidence metadata and session capabilities. No browser credential persistence is added.
- CSV escapes quotes and protects spreadsheet formula prefixes. JSON/export excludes bodies, credentials, cookies, capability, and captures.

## Persistence/privacy
The live extension retains admin capability/Origin protections. Its data listener accepts the canonical numeric Host and same-origin/none browser Fetch Metadata; additionally permit user-initiated same-site GET document navigation for the cockpit's entry link. Foreign Origin, foreign fetch/image requests and cross-site navigation remain rejected. Configured HTTP/HTTPS origins exclude URL credentials and URL paths/query/fragments. Check all DNS answers for prohibited loopback listener ports, metadata/link-local/unspecified/multicast addresses; pin an allowed address per request. TLS certificate validation remains enabled. No automatic redirects, public listeners, CONNECT or WebSocket tunnels are provided. Operators must choose development services, as forwarding preserves application method/body/headers in transit.

Live configuration/rules and latest-50 activity are memory-only. Never log bodies, cookies, authorization, tokens, query strings or target URLs. Pathnames may themselves include identifiers. Reset/shutdown cancels live work and destroys held sockets; no faults persist after restart. The control response sample consumes the body only to count bytes and returns no payload.

Stop/shutdown clears faults, cancels probes, and reports save failure. Corrupt/unsupported evidence is identified explicitly. Generated results/captures remain outside Git. Scope capture to synthetic demo traffic, review before sharing, and label simulation/capture/application evidence separately. Capture permissions remain unverified; no compliance claim is made.

## Dependencies and review
No third-party packages. Commit manifests/lockfile; review necessity before adding packages or changing boundaries. No public deployment or security weakening is authorized. Independent review found and prompted fixes for URL authorization, record chronology, header-deadline enforcement, shutdown persistence, and stale UI selection handling. Regression checks accompany the fixes.

## Residual limitations
Local machine compromise is out of scope. These checks are not an exhaustive security audit. Lab capture privileges and other-laptop environments/access remain unverified. A hard crash can lose latest unsaved phase observations.
