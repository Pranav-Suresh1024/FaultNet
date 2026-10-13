# Design System

## Approved dashboard contract
The [dashboard contract](../../docs/implementation-contracts.md#dashboard-proposal) follows the latest 13 October frontend-only redesign request. The [editable Figma concept](https://www.figma.com/design/ssgBMbLH8CUmZGmzGNE9nE?node-id=4-264) and [visual spec](../../docs/superpowers/specs/2026-10-13-workbench-visual-design.md) supply green-black/bone direction, measured evidence as the focal point, and a clear settings column. Original native HTML/CSS uses no new dependencies or measurement logic. No general accessibility-compliance or mobile-release claim is made.

## Visual tokens
The experiment workbench uses the tokens below. The live cockpit remains an independently written dark monospace page with an amber masthead (#f4b544), dark canvas (#101113), bordered controls and three columns: setup/presets/headers; network/failure/rules; traffic. At 1100 px the monitor follows two columns; at 640 px controls stack. `/` opens the cockpit and `/workbench` opens the redesigned workbench. The cockpit is unchanged by this visual checkpoint.

| Token | Value |
| --- | --- |
| Background / surface | #f1f3ed / #ffffff |
| Text / secondary text | #172923 / #59695f |
| Primary accent / highlight | #176b56 / #d7eda8 |
| Sidebar and median-chart stage / topbar | #172923 / #f1f3ed |
| Dark-stage text / secondary / faulty bar | #f5f8f2 / #b9c8bc / #fbad96 |
| Error | #9c3527 on #fff0ec |
| Body font | Inter if available, Segoe UI/system fallback; 16 px, line-height 1.5; no font download |
| Panel / control radius | 12 px / 6 px; minimum button/input height 44 px |
| Maximum content width | 1600 px plus 216 px desktop sidebar |
| Panel stack / navigation reflow | Below 1100 px / 760 px |

## Layout and components
One page with a plain FaultNet brand and only Workbench/Live proxy cockpit sidebar links. The latest user refinement removes icons, slogans, static workflow rail, redundant pills and duplicate labels; the compact topbar retains actual phase state. Keep functional settings/reuse/history/comparison/export controls, error text, units and measurement caveats. Four cards summarize availability, median response time, mean throughput, and confirmed run-level recovery. Auto selects baseline until a faulty attempt exists; explicit phase selection controls cards and detailed analysis. The dark median-chart stage retains all phases; its light phase table follows. Probe durations, successful-response distribution, outcome counts and captioned tables expose actual observations; failures/cancellations have text and distinct symbols. Missing values remain unavailable. Editable scenario controls and saved-run reuse sit alongside analysis, preceding it below 1100 px; compatible comparisons and protected downloads follow.

Tables retain phase labels, counts, units, and — for unavailable measurements. Overflowing charts/tables have focusable, labelled scroll regions to retain data and legible chart labels on narrow screens. SVG chart labels describe values in text for assistive technology.

Settings display input ranges/units. Baseline-only disables fault inputs. Active experiments disable new starts/settings while keeping Stop available. Poll status/results each second only while active; idle refresh follows user actions or Refresh. Stale selection responses are ignored and export filenames retain the requested record identity.

Display the conservative probing upper bound against 120 seconds and explain which settings to reduce. Validate after preset/reuse/input changes. Comparison and saved-record errors stay in their panels; healthy service readiness can still enable valid new experiments.

## States and accessibility
- Live: pending edits are labelled Draft until Apply, polling touches only the monitor, applied configuration reloads from server memory, and Reset discards drafts/clears faults/cancels active live traffic. Sample GET has a labelled five-second ceiling and stays disabled until its request settles, even across Apply/Reset. Monitor statistics refer to the latest 50 finished requests; filters do not change configuration or totals. All rules render as text-safe labelled inputs with keyboard-operable Add/Remove buttons.
- Empty: No experiment selected; show the start workflow.
- Running/stopping: Label state/phase; availability, attempts/cancellations, and fault status stay visible.
- Stopped/failed/interrupted: Preserve available evidence and label incomplete recovery.
- Unsaved: Warn evidence exists only in memory and should be downloaded before exit.
- Denied/error/corrupt: Display a safe explanation; list corrupt-record notices separately.
- Populated: Show phase data and downloads; flag incompatible protocol settings and show differing faults/states.
- Use semantic labels, skip link, fieldset/legend, captioned tables with headers, alert/status roles, visible keyboard focus, text-safe rendering, and no automatic motion. Dark-surface focus outlines use lime; light-surface outlines use the primary accent. Brief button feedback respects reduced motion.
- Outcomes do not rely on color alone. Test keyboard, contrast, reflow, and browser behavior on rendered UI; implemented semantics alone do not certify accessibility.

## Verification
See [HANDOFF.md](../../HANDOFF.md) for observed browser workflows and remaining checks. Reference is Chromium-based desktop browsing on Windows; other browsers/mobile are unverified. Separate lab observations remain pending.
