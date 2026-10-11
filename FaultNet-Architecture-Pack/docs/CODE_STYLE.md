# Code Style

## Concrete proposals for review
[Implementation contracts](../../docs/implementation-contracts.md#runtime-and-startup) proposes a reference Node runtime, ES modules, no third-party packages, and future start/test scripts. Its [module interfaces](../../docs/implementation-contracts.md#module-ownership-and-interfaces) coordinate agent work. No manifest, scripts, exports, or installed dependencies exist yet; approval is pending.

## Languages and conventions
- Approved: JavaScript on Node.js; plain HTML/CSS/JavaScript frontend.
- Node.js version and browser support: Unresolved.
- TypeScript: Not approved.
- Proposed naming: camelCase functions/variables, descriptive file names, and names matching approved API/schema terminology.
- Module format, formatter, and linter: Unresolved; no configuration exists.
- Proposed type discipline: Validate runtime inputs and document important contracts without assuming TypeScript tooling.

## Organization
- Proposed responsibilities follow [ARCHITECTURE.md](ARCHITECTURE.md).
- Dashboard code presents data and operator controls.
- Server-side modules own validation, authorization, experiments, faults, and storage.
- Browser code must not directly access result files or control targets.
- Proxy faults must not impair the dashboard/control channel.
- Shared utilities should be introduced only where an actual repeated need exists.
- There are no existing application patterns to preserve.

## Coding rules
Proposed rules:
- Agents perform all application coding.
- Keep functions focused and changes scoped to approved features.
- Validate external inputs at trust boundaries.
- Handle loading, empty, error, and success states explicitly.
- Avoid silent failures and unexplained numeric values.
- Keep measurement units explicit.
- Bound asynchronous operations and support cancellation.
- Clear applicable faults during stop/shutdown recovery.
- Never infer packet-level metrics from application failures.
- Do not copy the reference project's implementation.

## Errors and logging
- Proposed error shape: A stable error category and safe human-readable message.
- Exact API shape and status codes: Unresolved.
- Distinguish validation, authorization, demo availability, interruption, and storage failures.
- Do not log bodies, credentials, cookies, or unrestricted sensitive request details.
- Do not label an incomplete or unsaved result as successful.
- Follow [SECURITY.md](SECURITY.md).

## Dependencies
- No packages or manifests currently exist.
- New packages require approval of their purpose and resulting stack change.
- Exact package choices and versions: Unresolved.
- Proposed lockfile policy: Commit the appropriate lockfile and use reproducible installation once configured.
- No dependencies are installed during this documentation task.

## Review checklist
- Implementation matches PRD feature IDs and approved acceptance criteria.
- API, schema, security, and UI states agree.
- No sensitive data or unrelated changes.
- Required cancellation and failure paths are handled.
- Actual configured checks are run and accurately reported.
- Tests cover meaningful behavior.
- Changes to decisions update the companion documents.
- Application implementation requires a separate request.

## Verified commands
The inspected Windows project archive is empty.
- Development/start: Not configured.
- Format: Not configured.
- Lint: Not configured.
- Type check: Not configured.
- Build: Not configured.

These entries describe configuration, not successful test execution.
Do not invent commands based on the reference repository.
