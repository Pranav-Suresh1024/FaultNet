# Code Style

## Approved implementation
Application contracts were approved with the 12 October implementation-resume request. Follow the [module contracts](../../docs/implementation-contracts.md#module-ownership-and-interfaces), [architecture](ARCHITECTURE.md), and root [agent instructions](../../AGENTS.md).

## Languages and conventions
JavaScript ES modules on reference Node.js 22.23.1, semantic HTML, plain CSS/browser JavaScript. Use camelCase, descriptive file names, and exact contract terminology. No framework, TypeScript, formatter/linter, build pipeline, or third-party package is needed for the current application.

## Organization and coding rules
- Agents write all application and test code. The user supplies decisions and access.
- Keep browser presentation separate from server validation, authorization, lifecycle, faults, and storage.
- Use platform facilities and introduce shared helpers only for an actual repeated need.
- Validate inputs at trust boundaries; do not silently round, clamp, default invalid values, or retry probes.
- Bound asynchronous operations, support cancellation, and clear faults on stop/failure/shutdown.
- Keep counts, units, states, missing values, and evidence provenance explicit.
- Keep loading, empty, failed, stopped, incomplete, unsaved, and populated states understandable.
- Preserve local work; no force pushes or automatic conflict-side selection.
- Update callers, tests, exports, config, shared context, and all affected specifications when changing behavior.

## Errors and logging
Use safe categorized API errors with the approved status codes. Distinguish invalid input, denied requests, unavailable demo, busy experiments, transport outcomes, corrupt records, and storage failure. No stack traces, sensitive paths, bodies, cookies, or capability tokens in public errors/logs. An incomplete or unsaved result cannot be labelled successfully saved.

## Dependencies
package.json and package-lock.json contain zero external packages. .node-version records the reference runtime. No installation is needed to launch/test when the runtime is available. Adding packages or changing the approved stack requires explaining and recording that decision.

## Review checklist
Check behavior against PRD feature IDs and contracts; test meaningful success/failure/cancellation paths; inspect safe selected files before staging; run configured checks; document skipped/unavailable validation honestly. Independent review is part of the application checkpoint. Lab evidence and final release have their own gates.

## Verified commands
- Start: npm start (node src/main.js).
- Test: npm test (node --test).
- Whitespace: git diff --check.
- No separate application build, format, lint, or typecheck is configured. Optional lab-specific Python helpers are documented under labs/packet-tracer and do not add application dependencies.

Actual outcomes/environment are recorded in [HANDOFF.md](../../HANDOFF.md), not inferred from the presence of a script.
