# Design System

## Approved dashboard contract
The [dashboard contract](../../docs/implementation-contracts.md#dashboard-proposal) was approved with the 12 October implementation-resume request, then updated by the user's reference-inspired redesign approval. The [ClipTheme Packet dashboard](https://www.cliptheme.com/demo/packet/LAYOUT-1/#!/app/dashboard) supplies visual direction: charcoal shell, compact white panels, restrained red accent, and prominent metrics. This is an original plain HTML/CSS/JavaScript implementation. No general accessibility-compliance or mobile-release claim is made.

## Visual tokens
The experiment workbench keeps the tokens below. The 13 October live cockpit is an independently written dark monospace page with an amber masthead (#f4b544), dark canvas (#101113), bordered controls and three columns: setup/presets/headers; network/failure/rules; traffic. At 1100 px the monitor follows two columns; at 640 px controls stack. `/` opens the cockpit and `/workbench` preserves the original dashboard.

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
One page with sidebar links and a compact topbar. Four cards summarize availability, median response time, mean throughput, and confirmed run-level recovery. Auto selects baseline until a faulty attempt exists; explicit phase selection controls cards and detailed analysis. The median chart retains all phases. Probe durations, successful-response distribution, outcome counts and captioned tables expose actual observations; failures/cancellations have text and distinct symbols. Missing values remain unavailable. Editable scenario controls and saved-run reuse sit alongside analysis; compatible comparisons and protected downloads follow.

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
- Use semantic labels, skip link, fieldset/legend, captioned tables with headers, alert/status roles, visible keyboard focus, text-safe rendering, and no automatic motion. Sidebar focus outlines are white to contrast with charcoal; light-surface outlines use the primary accent.
- Outcomes do not rely on color alone. Test keyboard, contrast, reflow, and browser behavior on rendered UI; implemented semantics alone do not certify accessibility.

## Verification
See [HANDOFF.md](../../HANDOFF.md) for observed browser workflows and remaining checks. Reference is Chromium-based desktop browsing on Windows; other browsers/mobile are unverified. Separate lab observations remain pending.
