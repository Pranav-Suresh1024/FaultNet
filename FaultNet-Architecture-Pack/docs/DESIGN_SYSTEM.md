# Design System

## Approved dashboard contract
The [dashboard contract](../../docs/implementation-contracts.md#dashboard-proposal) was approved with the 12 October implementation-resume request. Implemented as one plain browser page on the task branch. No general accessibility-compliance or mobile-release claim is made.

## Visual tokens
| Token | Value |
| --- | --- |
| Background / surface | #f8fafc / #ffffff |
| Text | #0f172a |
| Primary | #1d4ed8 |
| Error | #b91c1c |
| Body font | System UI, 16 px, line-height 1.5 |
| Spacing unit / radius | 8 px / 8 px |
| Maximum width | 1200 px |
| Stack breakpoint | Below 768 px |

## Layout and components
One page with experiment settings/start/stop, readiness/current phase, phase metrics, saved-run selection, compatible cross-run comparison, and JSON/CSV downloads. Tables retain phase labels, counts, units, and — for unavailable measurements. Horizontal table scrolling retains the full data on narrow screens.

Settings display input ranges/units. Baseline-only disables fault inputs. Active experiments disable new starts/settings while keeping Stop available. Poll status/results each second only while active; idle refresh follows user actions or Refresh. Stale selection responses are ignored and export filenames retain the requested record identity.

## States and accessibility
- Empty: No experiment selected; show the start workflow.
- Running/stopping: Label state/phase; availability, attempts/cancellations, and fault status stay visible.
- Stopped/failed/interrupted: Preserve available evidence and label incomplete recovery.
- Unsaved: Warn evidence exists only in memory and should be downloaded before exit.
- Denied/error/corrupt: Display a safe explanation; list corrupt-record notices separately.
- Populated: Show phase data and downloads; flag incompatible protocol settings and show differing faults/states.
- Use semantic labels, fieldset/legend, captioned tables with headers, alert/status roles, visible keyboard focus, text-safe rendering, and no automatic motion.
- Outcomes do not rely on color alone. Test keyboard, contrast, reflow, and browser behavior on rendered UI; implemented semantics alone do not certify accessibility.

## Verification
See [HANDOFF.md](../../HANDOFF.md) for observed browser workflows and remaining checks. Reference is Chromium-based desktop browsing on Windows; other browsers/mobile are unverified. Separate Packet Tracer observations are in labs/packet-tracer; Wireshark observations remain pending. The dashboard's existing footer still needs its pending-evidence wording updated, as proposed in docs/codebase-review.md.
