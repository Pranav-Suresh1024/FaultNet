# Database

## Concrete proposals for review
[Record and persistence contract](../../docs/implementation-contracts.md#record-and-persistence-contract) proposes schema v1, UUID identifiers, record fields, safe writes, corruption handling, and explicit crash-durability limits; the [exports proposal](../../docs/implementation-contracts.md#exports) specifies JSON/CSV contents. These proposals remain unapproved and unimplemented.

## Storage model
- Approved storage: Local JSON files; no database service selected.
- Ownership: Single local lab operator; no tenants or account-owned records.
- Classification: Lab experiment metadata.
- Approved exclusions: Request bodies, credentials, and cookies.
- Wireshark captures remain separate from application records.
- Architecture source: [ARCHITECTURE.md](ARCHITECTURE.md).

## Entities
| Entity | Purpose | Owner | Retention |
| --- | --- | --- | --- |
| Experiment record | Settings, timestamps, outcomes, timings, and recovery observations | Local operator | Until manually deleted |
| Probe observation | Evidence for one experiment attempt | Same experiment/operator | With its experiment record |
| External evidence reference | Identify separate simulation/capture evidence without importing it | Local operator | Detailed policy unresolved |

The entity decomposition is proposed; approved data categories remain unchanged.

## Schema
Proposed schema, not an existing implementation:

Experiment record:
- schemaVersion: Required version identifier; initial value unresolved.
- id: Required unique identifier; format unresolved.
- createdAt: Required timestamp; ISO 8601 UTC proposed.
- startedAt/endedAt: Optional until the corresponding event occurs.
- state: Proposed running, stopping, completed, stopped, failed, or interrupted.
- settings: Required probe configuration and per-phase fault settings.
- observations: Probe observations available for the run.
- summary: Derived outcome counts and timing/throughput summaries.
- recovery: Fault-removal time, observation window, observed/not-observed state, and nullable duration.
- evidenceReferences: Optional references; never raw captures.

Probe observation:
- phase: Proposed baseline, faulty, or recovery.
- startedAt: Timestamp.
- elapsedMs: Nonnegative duration when measurable.
- outcome: Proposed response_complete, timeout, connection_error, interrupted, or cancelled.
- httpStatus: Nullable if no response was received.
- bytesReceived: Nonnegative count.
- successful: Derived from the approved response contract; cancelled attempts reported separately.

Null means unavailable/not observed where documented; zero must not stand for an unknown value.
Exact fields, types, enums, defaults, filenames, and schema version require approval.

## Relationships
- One experiment contains zero or more probe observations.
- Summaries derive from the same experiment's observations.
- External evidence references do not establish a live connection to Packet Tracer or Wireshark.
- Approved deletion is manual.
- Proposed storage unit: One complete JSON file per experiment; no cascade operations or database foreign keys.

## Access rules
- Local operator: Create experiments, read records, and export.
- Manual deletion: Explicit local filesystem action; no automatic expiration.
- Untrusted web origins or prohibited control requests: No permitted record or configuration access.
- Tenant isolation: Not applicable.
- Proposed enforcement: Fixed storage root, validated record identifiers, and no caller-supplied paths.
- Security source: [SECURITY.md](SECURITY.md).

## Queries and indexes
- Proposed queries: List experiments chronologically and select a record by identifier.
- Proposed comparison: Compare compatible baseline/fault/recovery phases.
- Database indexes: Not applicable to the approved JSON storage model.
- Pagination, retention limits, and anticipated record volume: Unresolved.

## Migrations and seed data
- Migration commands: Not configured.
- Proposed compatibility: Version records and explicitly reject unsupported or corrupt formats.
- Seed data: Synthetic only; no fixtures currently exist.
- Proposed persistence: Write safely so interrupted writes do not produce apparently valid partial records.
- Backup/restore procedure: Unresolved.
- Production migrations: Outside this task and MVP.

## Data validation
Proposed checks:
- Required identifiers, settings, timestamps, and approved field types.
- Nonnegative timings and byte counts.
- Fault values within approved numeric limits.
- Consistent phase ordering and summaries derived from observations.
- Missing recovery is represented explicitly.
- Invalid/corrupt records produce an error, not invented defaults.
- Storage failures are surfaced to the operator.
