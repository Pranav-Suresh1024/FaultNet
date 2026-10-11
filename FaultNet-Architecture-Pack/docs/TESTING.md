# Testing

## Goals and scope
Verify [PRD F-01 through F-07](PRD.md#feature-specifications) and the boundaries in [SECURITY.md](SECURITY.md).
Compare normal, faulty, and recovery conditions without conflating application failures with IP packet loss.
No tests or test configuration currently exist.

## Test layers
Proposed:
- Unit: Settings validation, measurement calculations, schema validation, and export formatting.
- Integration: Control API, fixed demo target, proxy faults, cancellation, and JSON persistence.
- End-to-end: Start baseline, apply a fault, clear it, inspect recovery, reopen results, and export.
- Local GUI/manual: Packet Tracer experiments, Wireshark observation, and checks unavailable to the agent environment.
- All application test code is written by agents. Local GUI observation does not require manual application coding.
- Availability of Packet Tracer/Wireshark automation: Unverified.
- Test frameworks and browser automation tools: Unresolved.

## Acceptance test matrix
| Feature/risk | Scenario | Expected result | Layer | Status |
| --- | --- | --- | --- | --- |
| F-01 | Reachable demo baseline | Labeled settings, outcomes, and timings | Integration/E2E | Not run |
| F-01 | Demo unavailable | Explicit failure; no fabricated success | Integration | Not run |
| F-02 | Configured delay | Recorded delay behavior checked against an approved tolerance | Integration | Not run |
| F-02 | Bandwidth restriction | Delivered throughput checked over an approved payload/window | Integration | Not run |
| F-02 | Connection interruption | Interruption recorded; UI remains usable | Integration/E2E | Not run |
| F-03 | Clear fault | Normal forwarding restored; recovery observations shown | Integration/E2E | Not run |
| F-03 | No recovery in window | Explicit not-observed result; no invented duration | Integration | Not run |
| F-04 | Compare/export | Records and exports preserve labels, units, and counts | Unit/E2E | Not run |
| F-04 | Incompatible/incomplete records | Clear warning or rejected comparison | Unit/E2E | Not run |
| F-05 | Save and reopen | Approved metadata retained | Integration | Not run |
| F-05 | Failed/corrupt storage | Error displayed; original evidence preserved where possible | Integration | Not run |
| F-06 | Network lab evidence | Simulation/capture provenance and limitations recorded | Lab review | Not run |
| F-07 | Loading/error/empty/stopped views | Operator sees state and safe recovery action | E2E | Not run |
| Permissions | Prohibited origin or arbitrary target | Denied; no control change or result leakage | Integration | Not run |
| Input safety | Invalid settings/path traversal | Rejected without filesystem or target escape | Unit/Integration | Not run |
| Resource safety | Repeated start or excessive settings | Approved bounds enforced | Integration | Not run |
| Stop/cleanup | Stop during a fault | Probes stop and faults clear without claiming missing results | Integration | Not run |
| Sensitive data | Record/log/export inspection | No request bodies, credentials, or cookies | Integration | Not run |
| Export safety | Spreadsheet-sensitive values | Safe CSV handling | Unit | Not run |

Tenant-isolation and account-login tests are not applicable to this MVP.

## Fixtures and environments
- Proposed fixtures: Synthetic responses with known body sizes and expected status.
- Fixed demo target only; no production services or credentials.
- Proposed isolation: Temporary test storage and faults disabled before/after each case.
- Keep Packet Tracer simulations separate from real application results.
- Browser, Node.js version, ports, numeric limits, and capture interfaces: Unresolved.
- Packet Tracer is installed locally; its version is unverified.
- Wireshark/capture privileges: Unresolved.

## Verified commands
- Unit/integration: Not configured.
- End-to-end: Not configured.
- Build/type check: Not configured.
- Packet Tracer/Wireshark automation: Not configured.
- No development or test commands have been executed.

## Release criteria
Proposed:
- Applicable acceptance scenarios pass with recorded evidence.
- Fault stop/restore and unauthorized-request checks pass.
- Saved records and exports agree with observed results.
- Measurement definitions and tolerances are approved.
- Required network-lab evidence is reviewed separately.
- Failures, skipped checks, and unavailable capabilities remain explicit.
- Release acceptance owner: Project owner/user.
- Deadline does not justify fabricated results or silent omission of required checks.

## Results
- Current state: No application tests run.
- Repository inspection found an empty project with no scripts or configuration.
- Future records must include environment, exact command/procedure, result, failures, and untested limitations.
- Keep Passed, Failed, Skipped, and Not run distinct.
- Add regression coverage for meaningful fixes.
- Archive/document validation is separate from application testing and does not validate application behavior.
