# FaultNet experiment workbench and audit fixes

Approved scope: the user's 13 October request authorizes both plans and their sequential implementation. Implement the expansion first, stop feature development, assess the second plan against the resulting tree, revise it if necessary, then apply the fixes. Stay on task/faultnet-mvp; this laptop owns application/context changes and the teammate owns the separate lab branch.

## Workbench

Keep the existing charcoal/red/white visual style and plain browser stack. Six presets fill editable settings without starting a run: healthy baseline; mild delay 150 ms; severe delay 1500 ms; constrained bandwidth 16 KiB/s; timeout stress (2000 ms delay, 500 ms timeout); complete HTTP outage (interruption). Use five probes and 250 ms intervals; timeout 3000 ms except bandwidth 5000 ms and timeout stress 500 ms. Editing inputs marks the selection Custom. Reuse copies the selected run's mode/count/interval/timeout/fault into the form, without mutating or starting the saved record.

Allow Auto/baseline/faulty/recovery selection for cards, detailed statistics, per-probe chart/table, distribution, and outcome breakdown. Auto preserves current baseline-then-faulty behavior. Missing phases remain empty. Recovery duration stays a run-level measurement and is labelled accordingly.

Statistics use successful complete responses for mean/median/nearest-rank p95/min/max and timing distribution. All attempts appear in the probe detail with outcome, bytes, elapsed time, and phase. Failure elapsed times are attempt durations, not successful response latency. Availability excludes cancelled probes; outcome counts include successes, failures, and cancellations. Preserve null and real zero distinctly. Show absolute changes from baseline in milliseconds, KiB/s, and percentage points; percentage change of median is unavailable when baseline is zero.

Use native SVG and captioned tables; keyboard-focusable chart/table scroll regions; text names/values and outcome shapes as well as colors. Histogram: up to eight equal-width bins, successful times only; a constant sample produces one bin; empty samples show an explicit empty state. Counts are descriptive, not statistical confidence claims.

No new packages, schema migration, stored summary fields, external targets, jitter, intermittent faults, persistent browser credentials, or lab merge.

## Audit fixes

Validate every recovery probe against clearance and confirmation/window; allow 2 ms rounding tolerance when comparing wall-clock timestamps with monotonic elapsed durations. Confirmed recovery requires its actual terminal three successful probes; reject earlier/later fabricated confirmation and inconsistent duration. Preserve genuine stopped/failed/in-progress records and report bad evidence rather than rewriting it.

Service readiness must govern Start independently of comparison/history/selected-record errors. Comparison errors stay in their own panel and cannot leave Start stuck; stale comparison requests cannot overwrite newer selections.

Share the exact conservative budget formula between browser and server: count × (timeout + interval) × (comparison ? 2 : 1) + (comparison ? 15000 : 0), maximum 120000 ms. Display it as an upper bound, not a predicted duration. Explain how to reduce excessive settings; server validation remains authoritative.

Add a deterministic real-stream cancellation regression that aborts after body bytes arrive, verifies partial unsuccessful evidence, clears the fault, and completes the next request. Remove only README's obsolete duplicate cloud Saving work example.

## Acceptance

Both plans travel in Git with the handoff. Node tests cover formulas, preset validity/reuse, missing/zero/failed/cancelled evidence, UI asynchronous paths, recovery chronology, budget parity, and actual throttle cancellation. Rendered checks cover presets, editing, phase selection, reuse, chart/table accuracy, keyboard use, narrow reflow, stop, and original downloads/comparison. Run npm test, diff/link checks, review, push, and confirm remote SHA/CI. Other-laptop runtime and full screen-reader/zoom certification stay explicitly open.
