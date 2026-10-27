# Final report evidence

These are reviewed aggregate results and figures, not raw experiment records. The complete local evaluation and capture remain ignored. Application source is unchanged from `313822e`; the evaluation uses Node 22.23.1 on the Windows laptop described in `summary.json`.

## Files and provenance

- `summary.json`: actual aggregate results, runtime/environment, settings, record-quality rejection and final reset check.
- `scenario-comparison.csv`: ten workbench conditions with counts, successful timings, goodput and restoration.
- `packet-summary.json`: 15 request-to-probe matches from three representative runs, including stream/frame references and timing intervals. No request bodies or raw packets.
- `figures/`: nine analytical plots/diagrams generated from the evidence. Routing values come from the separately reviewed simulator batches.
- `screenshots/workbench.png`: previously reviewed actual interface image. Its example run is illustrative and differs from the repeated evaluation; its technical timestamp is retained as evidence.
- `screenshots/packet-tracer-topology.png`: actual topology from the reviewed OSPF lab copy. Its drawing is not proof of a completed convergence test.

The report has eleven figures including these two screenshots. No interface image was generated or fabricated. A fresh browser screenshot attempt was blocked by Computer Use because it could not verify the current browser URL; it was not retried through another UI route. Packet analysis used TShark independently. Packet Tracer values are the bounded prior review in [packet-tracer-review.md](../../packet-tracer-review.md), not a fresh simulator rerun.

## Protocol and denominators

The workbench uses ten repeated blocks, cyclically rotated scenario order, five baseline and five faulty attempts, and three successful recovery attempts after fault clearance. The interval is 250 ms; timeout is 5,000 ms except the explicit 500/2,000 ms pair with fixed 1,000 ms delay. Payload is 65,536 synthetic F bytes. Accepted evidence consists of 100 validated, saved terminal records and 1,300 observations. Each condition has 50 faulty attempts.

There were **101 attempted workbench runs**. One bandwidth-32 run failed persistence/record validation: the UTC recovery interval was 537 ms and its monotonic duration 534.6247 ms, a 2.3753 ms discrepancy exceeding the 2 ms tolerance. The rejected record remains local and its identity/reason is retained in aggregate record quality. It is excluded from timing statistics; the same condition was repeated to restore the balanced design. This exclusion is a validation failure, not an injected network failure. The report discloses it; no application fix was made.

The overhead comparison contains 50 direct and 50 fault-free proxied requests in ten paired blocks, with three warm-up pairs excluded. The live study contains eight configurations with ten samples each (80 requests), plus a final normal reset check. Readiness probes and warm-up requests are not added to the 1,300 phase-observation count. The 55,392-packet filtered capture began after overhead collection and stopped after the measured live requests; it does not claim full overhead coverage. TShark decoded it successfully. It contains zero control-port packets. There is no capture-statistics block, so **capture drops are unknown**, not asserted zero.

## Definitions

- Availability: successful / eligible attempts; cancellation is excluded from eligibility.
- Successful timing: complete HTTP 200 with exactly the expected 65,536 bytes and contents. Failed attempts have no successful median/p95/goodput.
- Goodput: arithmetic mean of each successful request's 64 KiB divided by its full elapsed seconds, including connection and waiting. It is not wire bandwidth.
- p95: nearest rank in sorted successful times. Fifty samples support descriptive results, not a universal tail estimate.
- Paired added time: faulty median minus baseline median within each run, then median across ten runs.
- Bootstrap: 3,000 resamples of run-level paired differences, seed 308, percentile 95% interval. This is exploratory local uncertainty, not a population guarantee.
- Recovery duration: time from fault clearance to the three-success criterion; two inter-probe waits contribute about 500 ms. The paired recovery residual separately compares response behavior with baseline.
- Packet HTTP time: GET to the decoded/reassembled HTTP response on the same connection. First response data is also measured. These differ from application consumption time and from TCP ACK RTT.

The static/RIP/OSPF bars describe four-ping settled batches in one topology. Initial/transient losses are preserved in the linked review. Fast Forward Time was used; no wall-clock convergence ranking or general protocol-reliability claim is supported.

## Reproduction

The application has no added dependencies. Analysis uses Python with `matplotlib`, `numpy`, `python-docx` and `pypdf`; document export uses installed Microsoft Word on Windows. These are report-authoring tools, not application runtime requirements. This laptop used the bundled Python/runtime and task-local analysis packages; another laptop can use its own equivalent environment.

1. Fetch this report branch and read the [handoff](../FINAL-REPORT-HANDOFF.md). Run `npm start` with Node 22.23.1 and the normal synthetic demo live target. Ensure no other experiment/operator is active.
2. `node scripts/evaluate-report.mjs` collects/resumes local evidence under `.codex/final-report/evaluation.json`. It refuses application-source differences from `313822e` and validates records. A validation failure is checkpointed and stops collection for review; rerunning resumes the missing condition without discarding the rejected run. Allow roughly twenty minutes and keep the laptop awake. Live effects are reset and the previous applied configuration restored in `finally`.
3. For a fresh capture, identify the current loopback interface with `dumpcap -D`. Capture `host 127.0.0.1 and (tcp port 3001 or tcp port 3002 or tcp port 8080)` into `.codex/final-report/evaluation.pcapng` before measured workbench conditions. Stop capture after requests finish. Review it locally; never add it to Git.
4. Run `python scripts/analyze-report.py` and `python scripts/correlate-report.py`. The latter uses the standard Windows TShark installation path. It requires a complete covered five-request run for each selected condition and asserts timestamp/stream linkage. Other platforms need their TShark path adjusted.
5. Run `python scripts/build-final-report.py`, then `powershell -File scripts/export-report.ps1`. The builder can regenerate the current report from the committed aggregates/screenshots and preserved partial report without raw trials. Word refreshes the automatic contents and page fields before PDF export.
6. Run `python scripts/verify-report.py`, render the PDF pages and inspect them all. The verifier checks this final evidence snapshot; its fixed expected counts must be reviewed if a new study replaces the dataset. Different machines can produce different numbers; regenerate analysis rather than copying these values into a new study.

No raw capture, generated experiment record, token, account data, or task-local analysis installation is shared in this folder.
