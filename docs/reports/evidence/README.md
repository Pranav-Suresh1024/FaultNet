# Final report evidence

## Pinned revisions and shared files

Application baseline: `313822e58f7d4420550a1836ebe949dc4727b88c`.
Numerical evidence and evaluation/analysis scripts: `515ff591e4433c98021599623c0b14664f17329a`.
[Permanent numerical evidence snapshot](https://github.com/Pranav-Suresh1024/FaultNet/tree/515ff591e4433c98021599623c0b14664f17329a/docs/reports/evidence).
The current report revision and artifact checksums are in [the handoff](../FINAL-REPORT-HANDOFF.md).

- `analysis-inputs.json`: sanitized original numerical inputs: 100 trial rows, 1,300 phase durations, success flags, confirmation durations, 100 direct/proxy durations and 80 live outcomes. This is a column-limited analysis dataset, not persisted experiment records. No session capabilities, response bodies, wall-clock timestamps, raw packets or account data. Synthetic live rule configuration is retained.
- `summary.json` and `scenario-comparison.csv`: recalculated statistics and ten-condition comparison. All values match the preceding report exactly.
- `packet-summary.json`: fifteen matched request/probe timing rows with stream and frame references. Raw capture remains local.
- `provenance.json`: full application/evidence/lab revisions, Packet Tracer version and unknown capture-drop count.
- `reference-verification.json`: six Crossref-verified DOI publications with freely retrievable complete PDFs, plus the checked Stanford alternate for paper [6]. Citation/review text is in [scholarly-references.json](../scholarly-references.json).
- `figures/`: nine analytical figures. Calibration includes zero delay; the live figure shows individual observations and median markers. Recovery plot shows selected conditions; Table 13 includes all ten.
- `screenshots/workbench.png` and `screenshots/packet-tracer-topology.png`: previously reviewed real images, labelled separately from the repeated measurements. The follow-up native browser view also confirmed the local access-boundary rejection after ordinary address-bar navigation. Browser diagnostics reported a paused document response. No security restriction/header was weakened or screenshot fabricated.
- `followup-verification.json`: separate fresh check of 61 passing tests, ten accepted workbench runs / 130 phase observations, and eight live cases / 80 samples with a successful reset. These values are not added to the original study. Raw follow-up records remain ignored in `.codex/cockpit-followup/`; existing collection tooling was run with that directory and one round.

## Protocol and definitions

Ten runs per workbench condition, cyclic scenario order, five baseline and five faulty requests per run, three successful recovery requests after clearance. Interval 250 ms; timeout 5,000 ms except the fixed-1,000-ms-delay study using 500/2,000-ms deadlines. Payload 65,536 synthetic F bytes. There are 100 accepted saved runs and 1,300 phase observations; each condition has 50 faulty attempts.

There were 101 attempted runs. One bandwidth-32 run failed persistence/record validation: UTC recovery duration 537 ms versus monotonic 534.6247 ms, difference 2.3753 ms, exceeding the 2 ms tolerance. Preserve the rejection identity/reason and local record. It is excluded from timing aggregation and the condition was repeated. This is not an injected network failure. The sanitized dataset preserves the audit count/discrepancy but cannot independently revalidate record chronology.

- Request success rate = successful / eligible attempts, excluding cancellation. The internal legacy JSON key `availabilityPct` is unchanged.
- Workbench timing statistics include only complete HTTP 200 responses with the expected payload. Failed attempts have no successful median/p95/goodput.
- Goodput is the arithmetic mean of individual successful-request payload rates, not payload divided by median duration and not wire bandwidth.
- p95 uses nearest rank. Paired added time is the median of ten within-run faulty-minus-baseline medians.
- Bootstrap uses 3,000 resamples of run-level differences, seed 308, exploratory 95% percentile interval: sorted positions 75 and 2,925, one-based.
- Recovery confirmation includes two 250 ms waits; it is not raw fault-removal latency.
- Live `Completed with HTTP 200` requires both completion and status 200. Median attempt duration includes failures. Headers alone do not establish successful body completion.
- Zero-delay paired added time is 14.61 ms; the separate direct/proxy block difference is 2.32 ms. These compare different paths/sequences. Timer scheduling is a hypothesis, not an isolated cause or correction factor.

The overhead study has ten paired blocks, 50 direct and 50 fault-free proxied requests after three warm-up pairs. Live evaluation has eight configurations with ten samples, plus a final normal reset check. The capture began after overhead collection, contains 55,392 packets and no control-port packets, and has no interface-statistics block: capture drops are unknown.

Routing is the bounded prior review in Packet Tracer 9.0.1 at lab commit `9f72386cf4a1ae30ccd50ba7c0a1a403b3178229`; see [the review](../../packet-tracer-review.md). Report route excerpts and ping summaries retain alternate R3 next-hop evidence and transient qualifications. Fast Forward Time prevents a wall-clock RIP/OSPF speed ranking.

## Rebuild the document from aggregates

Use the report revision in the handoff. Save/close the intended output first. With Python packages `python-docx` and `pypdf`, run:

```text
python scripts/build-final-report.py
powershell -File scripts/export-report.ps1
python scripts/verify-report.py
```

Defaults create `FaultNet-final-report-revised.docx` and matching PDF, preserving earlier reports. The builder reads committed aggregates, figures, citations and the partial-report cover/template. It does not run experiments or recalculate statistics. Microsoft Word is required for this export helper. Refreshing fields may change binary hashes; verify values and render again. The original course order is retained, including abstract placement; contents includes level-three performance subsections and Appendix A.

## Recalculate results from original numerical observations

With `matplotlib` and `numpy` installed:

```text
python scripts/analyze-report.py
```

No running application, ignored evaluation JSON or local capture is needed. The script reads committed `analysis-inputs.json` and regenerates workbench/live/overhead statistics, confidence intervals, CSV and eight figures. The ninth analytical figure is packet-derived and remains backed by the packet summary/capture analysis. Resource/environment metadata and the rejection audit are retained facts, not newly measured by this command. Re-decoding streams and checking original record chronology require the unshared local originals.

## Collect a replacement evaluation

1. Use Node 22.23.1, run `npm start`, and ensure no other experiment/operator is active.
2. Run `node scripts/evaluate-report.mjs`; it collects/resumes `.codex/final-report/evaluation.json`, checks source against the application baseline, checkpoints validation failures and restores live configuration. Preserve rejected runs.
3. Optionally identify loopback using `dumpcap -D` and capture `host 127.0.0.1 and (tcp port 3001 or tcp port 3002 or tcp port 8080)` during measured traffic. Keep captures local.
4. Run `python scripts/prepare-report-inputs.py`, review the projected fields, then run the analysis. `python scripts/correlate-report.py` additionally requires the original covered capture and local records, with the standard Windows TShark path. New measurements must be a labelled replacement study, not silently merged with published numbers.
5. Rebuild, refresh fields, verify and inspect every rendered page before sharing.

For reference-access checks use `python scripts/check-report-references.py`. The repository link remains outside References. No application dependency, backend or dashboard was changed for this report revision.
