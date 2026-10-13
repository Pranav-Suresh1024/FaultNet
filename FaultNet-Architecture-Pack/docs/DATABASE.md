# Database

## Approved record contract
The application [record/persistence contract](../../docs/implementation-contracts.md#record-and-persistence-contract) and [export contract](../../docs/implementation-contracts.md#exports) were approved with the 12 October implementation-resume request and implemented on the task branch.

## Storage model
One local results/{UUID-v4}.json per experiment, schemaVersion 1. No database service, tenants, expiry, deletion endpoint, or migrations. Retention lasts until a separately authorized filesystem deletion. Capture data remains separate.

## Schema
Required root fields: schemaVersion, id, createdAt, startedAt, endedAt, state, settings, observations, summary, recovery, persistence, error, evidenceReferences. See the contract for exact types and fixed normalized settings.

- States: running, stopping, completed, stopped, failed, interrupted.
- UTC timestamps describe chronology; elapsed durations use a monotonic clock.
- Observations record phase, startedAt, elapsedMs, outcome, httpStatus, bytesReceived, successful.
- Summaries derive from the same observations. Cancelled probes are excluded from availability; missing metrics are null.
- Workbench min/max, histogram bins, probe visuals and baseline changes are derived in the browser from these same observations/summaries, without new stored fields or a schema migration. Reuse copies editable settings only.
- Recovery records clearance, confirmation, criterion/window, observed state, and nullable duration. Baseline recovery is not applicable.
- Persistence explicitly identifies saved or failed evidence; errors contain safe categories/messages.
- Reviewed evidence references identify packet_tracer or wireshark material under labs/. No evidence-edit API exists.
- Never store response/request bodies, credentials, cookies, session capability, or raw captures.

## Validation and access
Validate identifiers before building fixed-root paths. Read only regular nonsymlink JSON files up to 1 MiB. Reject unsupported schemas, unexpected fields, invalid settings, unordered/out-of-run observations, inconsistent summaries, and invalid recovery metadata. Lists report per-record errors alongside valid records. API access follows [SECURITY.md](SECURITY.md).

## Persistence and crash behavior
Write a unique temporary file in the same directory, flush, close, then rename. Failed replacement preserves the previous valid file. Initial save precedes start acceptance; phase and terminal saves follow. Runtime save failure fails the experiment, clears faults, and preserves current evidence in memory for download until exit. Shutdown reports unsaved evidence.

Restart labels saved active records interrupted. Latest in-phase observations may be absent after a hard crash. This is phase-boundary durability, not a power-loss guarantee or per-probe journal.

## Queries, exports, and transfer
List newest first, read by validated identifier, compare compatible protocols, export validated JSON or fixed-column CSV. CSV protects formula-sensitive text and preserves empty-run metadata. No pagination is included in this small local lab; revisit for a large archive.

Synthetic fixtures are built by agents inside temporary test directories. Records/captures are ignored by Git and do not move with source pushes. Deliberately review/export/transfer evidence separately if needed. No automatic evidence backup is configured.

## Validation evidence
Storage, corruption, restart interruption, chronology, failure retention, and export parity checks are in tests/storage.test.js, tests/runner.test.js, tests/api.test.js, and tests/lifecycle.test.js. Exact outcomes are recorded in [HANDOFF.md](../../HANDOFF.md).
