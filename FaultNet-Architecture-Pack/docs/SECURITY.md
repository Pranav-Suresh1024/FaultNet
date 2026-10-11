# Security

## Concrete proposals for review
[Local control security](../../docs/implementation-contracts.md#local-control-security) proposes exact Host/Origin checks, an in-memory session capability, asset allowlisting, request/resource limits, and security regression cases. These are proposed enforcement choices, not implemented or tested protections.

## Assets and trust boundaries
- Assets: Experiment controls, fixed demo target, local result files, and separate packet captures.
- Untrusted inputs: Browser requests, settings, identifiers, stored file contents, and external reference material.
- Relevant threats: Cross-origin control requests, arbitrary-target proxying, path traversal, excessive resource use, accidental sensitive capture, and misleading/incomplete evidence.
- Loopback binding reduces exposure but does not make every local process or website trustworthy.

## Authentication and authorization
- Approved identity model: One local operator; no accounts or identity provider.
- Approved boundary: Loopback-only controls and fault injection restricted to the project demo server.

| Caller | Read results | Start/stop/configure | Export | Delete |
| --- | --- | --- | --- | --- |
| Intended local operator | Allowed | Allowed within approved limits | Allowed | Explicit manual file deletion |
| Untrusted web origin/prohibited request | Denied | Denied | Denied | Denied |
| Remote network client | No control listener exposed | Denied | No control listener exposed | Denied |

Proposed enforcement:
- Bind control services to loopback interfaces.
- Validate Host and browser Origin; prohibit permissive cross-origin control access.
- Use side-effect-free read requests and validated mutation requests.
- Reject arbitrary targets and paths.
- Determine whether an additional per-session anti-CSRF capability is needed; mechanism unresolved.
- Do not claim protection from a compromised machine or privileged local process.
- Accounts, tenant checks, account recovery, and session revocation: Not applicable.
- Operational recovery: Stop the experiment and clear faults; detailed cleanup behavior proposed.

## Secrets and configuration
- No application credentials or secret variables have been identified as required.
- Future secret requirements need explicit review.
- Never put secrets in documents, source, browser assets, JSON records, or logs.
- Ports, limits, and storage locations are non-secret configuration; names/values unresolved.

## Input and output handling
Proposed controls:
- Validate settings, record identifiers, permitted methods, and expected JSON.
- Enforce duration, concurrency, payload, request-size, and rate bounds; numeric values unresolved.
- Render untrusted text safely rather than interpreting it as HTML.
- Do not pass user input into shell commands.
- Prevent file-path traversal and target substitution.
- Export only approved fields.
- Handle CSV spreadsheet-formula interpretation safely.
- Application uploads: Outside the MVP.
- No broad CORS policy or public proxy service.

## Privacy
- Collect approved experiment metadata only.
- Retain records until manually deleted.
- Do not store request bodies, credentials, or cookies.
- Keep captures separate; captures may contain sensitive traffic.
- Proposed capture practice: Use synthetic demo traffic, minimize capture scope, and review captures before sharing.
- Proposed logging: Stable error categories and identifiers, with sensitive values redacted.
- No regulatory compliance claim is made.

## Dependencies and deployment
- No application dependencies are configured.
- Proposed policy: Review package necessity and maintenance, commit lockfiles, and preserve TLS/integrity verification.
- Only the local lab environment is approved.
- Public deployment is outside scope.
- Security-sensitive changes require project-owner review of changed boundaries.
- No package installation or deployment occurs during document preparation.

## Verification
Proposed tests in [TESTING.md](TESTING.md) cover:
- Prohibited origins and targets.
- Invalid settings and path traversal.
- Resource limits and stop/restore behavior.
- Safe rendering, exports, and sensitive-data exclusion.
- Tenant-isolation tests are not applicable.

Residual risks:
- Compromised/privileged local processes are outside the protection model.
- Packet-capture permissions and privacy remain unresolved.
- Resource ceilings and browser-origin protection must be finalized.
- Owner: Project owner/user.
- Security tests: Not run.
