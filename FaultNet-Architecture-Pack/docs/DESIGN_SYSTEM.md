# Design System

## Approved dashboard contract
The [dashboard contract](../../docs/implementation-contracts.md#dashboard-proposal) was approved with the 12 October implementation-resume request, then updated by the user's reference-inspired redesign approval. The [ClipTheme Packet dashboard](https://www.cliptheme.com/demo/packet/LAYOUT-1/#!/app/dashboard) supplies visual direction: charcoal shell, compact white panels, restrained red accent, and prominent metrics. This is an original plain HTML/CSS/JavaScript implementation. No general accessibility-compliance or mobile-release claim is made.

## Visual tokens
| Token | Value |
| --- | --- |
| Background / surface | #f3f4f7 / #ffffff |
| Text / secondary text | #303440 / #626979 |
| Primary accent | #b9382c |
| Sidebar / topbar | #2b2e3b |
| Error | #9d2820 on #fff0ee |
| Body font | System UI, 16 px, line-height 1.5 |
| Spacing / radius | Compact component spacing / 4–5 px |
| Maximum content width | 1500 px plus desktop sidebar |
| Panel stack / navigation reflow | Below 950 px / below 768 px |

## Layout and components
One page with sidebar section links and a compact topbar. Four cards summarize availability, median response time, mean payload throughput, and confirmed recovery. Cards label baseline until a faulty attempt exists, then faulty phase. The central chart shows actual phase medians and sample counts; missing successful responses are explicitly labelled and never drawn as zero. Compact experiment controls sit alongside the analysis on wide screens; saved selection and compatible cross-run comparisons follow. JSON/CSV downloads stay protected by the existing API capability.

Tables retain phase labels, counts, units, and — for unavailable measurements. Overflowing charts/tables have focusable, labelled scroll regions to retain data and legible chart labels on narrow screens. SVG chart labels describe values in text for assistive technology.

Settings display input ranges/units. Baseline-only disables fault inputs. Active experiments disable new starts/settings while keeping Stop available. Poll status/results each second only while active; idle refresh follows user actions or Refresh. Stale selection responses are ignored and export filenames retain the requested record identity.

## States and accessibility
- Empty: No experiment selected; show the start workflow.
- Running/stopping: Label state/phase; availability, attempts/cancellations, and fault status stay visible.
- Stopped/failed/interrupted: Preserve available evidence and label incomplete recovery.
- Unsaved: Warn evidence exists only in memory and should be downloaded before exit.
- Denied/error/corrupt: Display a safe explanation; list corrupt-record notices separately.
- Populated: Show phase data and downloads; flag incompatible protocol settings and show differing faults/states.
- Use semantic labels, skip link, fieldset/legend, captioned tables with headers, alert/status roles, visible keyboard focus, text-safe rendering, and no automatic motion. Sidebar focus outlines are white to contrast with charcoal; light-surface outlines use the primary accent.
- Outcomes do not rely on color alone. Test keyboard, contrast, reflow, and browser behavior on rendered UI; implemented semantics alone do not certify accessibility.

## Verification
See [HANDOFF.md](../../HANDOFF.md) for observed browser workflows and remaining checks. Reference is Chromium-based desktop browsing on Windows; other browsers/mobile are unverified. Separate lab observations remain pending.
