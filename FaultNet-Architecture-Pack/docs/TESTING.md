# Testing

## Approved protocol and scope
Use the approved [test/evidence protocol](../../docs/implementation-contracts.md#test-and-evidence-protocol) to verify [PRD F-01 through F-07](PRD.md#feature-specifications) and [security](SECURITY.md). Application test code is written by agents. Never infer IP packet loss or RTT from HTTP outcomes.

## Test layers
- Unit: Settings, metrics, record chronology, exports, presentation/compatibility, six presets/reuse, phase statistics/distributions/deltas, and missing/zero/failed/cancelled evidence.
- Integration: Real local HTTP demo/proxy/API; delay/throttle/interruption; cancellation; persistence failure/restart; header deadlines and port cleanup.
- Lifecycle: Baseline/fault/clear/recovery, repeated start/stop, no-recovery window, and failed shutdown saves.
- Browser: Rendered dashboard controls, phase output, saved selection/comparison, stop, and downloads. Node tests alone do not certify UI behavior.
- Separate lab review: Actual Packet Tracer and Wireshark evidence is not yet available.

## Acceptance coverage
| Feature/risk | Evidence/check |
| --- | --- |
| F-01 baseline and unavailable demo | API/runner/network tests |
| F-02 delay/throttle/interruption | Real 64 KiB HTTP integration/calibration |
| F-03 recovery/stop/no recovery | Runner and lifecycle tests |
| F-04 compare/export | Metric/presentation compatibility, JSON/CSV parity, browser observation |
| F-05 persistence/corruption | Temporary filesystem reopen, interrupted restart, invalid records, failed writes |
| F-06 network lab | Pending actual separate evidence |
| F-07 states/control denial | API regressions and bounded browser observations |
| Host/Origin/capability/path security | Hostile Host/Origin, Unicode token, missing token/Origin, canonicalized/absolute paths |
| Input/resource bounds | Wrong/unknown/null fields, invalid ID, oversize/malformed body, busy run, request rate, partial headers |
| Cleanup | Delay cancellation, throttle stop observation, port collision cleanup, failed-save shutdown |
| Export safety | Formula-sensitive text, missing metrics, empty-run metadata |

## Calibration
Five baseline and five 500 ms delay samples: median difference 400–800 ms, timeout 3000 ms. Three 65,536-byte samples at 32 KiB/s: each whole-response goodput 24–36 KiB/s, timeout 5000 ms. Report actual observations, including failures; do not widen tolerance silently.

## Fixtures and environments
Use synthetic responses, temporary storage, ephemeral loopback ports, and guaranteed cleanup. No production traffic/credentials or network-package downloads. The reference runtime is Node.js 22.23.1. Confirm tool versions/access on other laptops; Packet Tracer version and Wireshark privileges remain unverified.

## Verified commands
- npm test: Node built-in runner; exact current count/results in HANDOFF.md.
- npm start: Observed dashboard startup at http://127.0.0.1:3000.
- git diff --check: Whitespace review before committing.
- No build/typecheck/lab-automation command is configured.

## Release criteria and results
Application checkpoint validation does not finish the full course project. Required lab evidence, both-active-laptop checks, rubric/deadline confirmation, and release acceptance remain gates. Record Passed, Failed, Not run, and Unavailable separately in the [handoff](../../HANDOFF.md) and [implementation ledger](../../docs/implementation-progress.md). No crash/power-loss durability or exhaustive browser/security certification is claimed.
