# FaultNet final report handoff

Updated: 28 October 2026, Asia/Kolkata. Branch: `task/final-report`.

## Current deliverables

Use [the revised editable report](FaultNet-final-report-revised.docx) and [matching PDF](FaultNet-final-report-revised.pdf). These supersede the earlier final report for submission review. Earlier final/partial reports remain unchanged, including the report already open in Word. The twelve course sections and their order, cover/logo, student details, supervisor and unsigned declaration are preserved. The abstract stays in its template position. Revised length: 26 pages, 16 editable tables, eleven figures plus logo, 32 headings and approximately 7,005 extracted words. Contents includes all seven performance subsections and Appendix A.

No application, package, runtime contract or teammate lab changes. No main merge or deployment is authorized by this report checkpoint.

## Immutable revisions and checksums

- Application: `313822e58f7d4420550a1836ebe949dc4727b88c`.
- Evaluation scripts and numerical evidence: `515ff591e4433c98021599623c0b14664f17329a`.
- [Permanent evidence snapshot](https://github.com/Pranav-Suresh1024/FaultNet/tree/515ff591e4433c98021599623c0b14664f17329a/docs/reports/evidence).
- Revised report/document scripts: `5b5a6ae3c846c36ffe1183abe94b0f66f67f12da`.
- [Permanent revised report snapshot](https://github.com/Pranav-Suresh1024/FaultNet/tree/5b5a6ae3c846c36ffe1183abe94b0f66f67f12da/docs/reports). This handoff-only metadata update follows that immutable artifact commit, avoiding a self-referential hash.
- Reviewed lab: `9f72386cf4a1ae30ccd50ba7c0a1a403b3178229`, Packet Tracer 9.0.1; separate `task/packet-tracer-labs` branch, unmerged.

SHA-256 of the final revised files:

```text
DOCX e023192ec19982f704e7bc89928bb1a6aaf55a460baf7f5de0fd5ac560924b89
PDF  d685536d33d24e26d61b76aec1d3479e20ae8aafdf1ce7191ab77620f6e93968
```

Field refresh or a Word save can change binary hashes; compare downloaded files before opening/resaving. Rebuilds are expected to preserve content/statistics, not necessarily binary hashes.

## Review changes and verification

- Table 14 now distinguishes completed requests from completed HTTP-200 requests, and labels median attempt duration, including failures. Table 10 labels successful timing and mean per-request goodput. Request success rate replaces the statistical use of availability; application schema keys are unchanged.
- Zero-delay calibration includes 14.61 ms paired added time and its interval. The separate 2.32 ms direct/proxy comparison is explained; timer scheduling remains a hypothesis, not an established cause or a correction factor.
- Bootstrap procedure states 95% percentile interval, 3,000 resamples, seed 308 and ten run-level differences, with five faulty requests within each run.
- Shared `analysis-inputs.json` holds only original numerical analysis columns, flags and synthetic settings. Running analysis against it reproduced every prior summary value exactly: 100 accepted runs, 1,300 phase observations, 100 overhead durations and 80 live samples. No raw persisted records, capture, capabilities or wall-clock observation timestamps were committed.
- Rejected-run disclosure, high-rate 61.81% attainment, HTTP-versus-IP distinction, three-success recovery policy and refusal to rank routing convergence speed are preserved. All ten recovery conditions appear in Table 13. Live Figure 8 shows individual observations, not median bars alone.
- Capture drops are explicitly unknown in the report. Packet Tracer version/full lab revision and reviewed route excerpts/ping summaries support the layout image without inventing a fresh simulator run.
- Table 1 compares layer/faults, automation/evidence/persistence and limitations, including FaultNet. Contributions are more concrete and limited to documented responsibilities. Scholarly references remain; paper [6] has an additional checked Stanford full-paper link. GitHub/evidence links remain outside References.
- Unnecessary forced page breaks removed; 26 final pages rendered at 100 dpi and all inspected. Tables remain editable with repeated continuation headers; no clipping/overlap or broken navigation found. The new appendix distinguishes document generation, numerical recalculation and replacement experiments.
- `scripts/verify-report.py` passed all structure, measurement, link, contents, source-preservation and no-draft/date/prose checks. All 15 external links also survived PDF export. Six publication DOIs/full PDFs and the additional Stanford copy were checked again. Changed Python scripts compile successfully. `git diff --check` passed; application files match the pinned baseline.
- Fresh follow-up: 61/61 tests passed, zero failures/skips/cancellations, Node 22.23.1, 18.073 seconds. The existing collector ran with one round and separate local output: ten accepted saved workbench runs / 130 phase observations (50 baseline, 50 faulty, 30 recovery), no rejected records and recovery confirmed in all ten. Interruption and the 500 ms deadline gave 0/5 faulty successes; other cases gave 5/5. Eight live scenarios produced 80 requests; HTTP 503, disconnect and stall outcomes matched their intended mechanisms, and reset returned HTTP 200 / 65,536 bytes. See evidence/followup-verification.json. Original study inputs/aggregates are unchanged; the fresh batch is described separately at the end of Appendix A. No fresh capture or simulator execution.

## Reproduction modes

See [the evidence guide](evidence/README.md) and report Appendix A for exact commands.

1. **Generate the document from aggregates:** `python scripts/build-final-report.py`, then `powershell -File scripts/export-report.ps1`, then `python scripts/verify-report.py`. Uses committed figures/statistics and the preserved partial template. Default output is the revised pair. It neither runs experiments nor recalculates statistics. Needs python-docx/pypdf and Microsoft Word; save/close the intended output first.
2. **Recalculate numerical results:** `python scripts/analyze-report.py`, with matplotlib/numpy. Reads committed sanitized numerical inputs; no application or ignored raw evaluation file needed. Recreates workbench/live/overhead statistics, bootstrap intervals, CSV and eight analytical figures. Packet figure decoding and original chronology validation remain dependent on the local originals. Rejection/environment metadata are retained audit facts.
3. **Collect new evidence:** Node 22.23.1, `npm start`, then `node scripts/evaluate-report.mjs` on an idle setup. Retain rejected records and inspect before resume. `python scripts/prepare-report-inputs.py` projects a new shareable numerical dataset for review; analysis then uses that dataset. Fresh packet correlation additionally requires the covered raw capture and local records. A replacement study must be labelled and not silently combined with published observations.

## Remaining boundary and next action

A fresh live-cockpit screenshot is the one requested visual addition not completed. The extension route and ordinary native address-bar navigation both returned the dashboard's local access-boundary rejection. The actual native view was inspected; browser diagnostics additionally reported a paused document response. No restriction was bypassed, no UI image was fabricated, and no failed browser route is represented as successful UI verification. Existing workbench/topology screenshots and independently measured live numerical results remain. A future legitimate browser session can add a readable actual cockpit screenshot without changing the quantitative evidence.

The report documents, but does not fix, the recovery UTC/monotonic validation boundary or the high-rate pacing limitation. Other-laptop runtime checks, a new UI/accessibility pass, fresh Packet Tracer execution and full rehearsal remain separate gates. Local raw originals, rendered QA pages, backups and Word locks remain unshared. The live configuration was restored by the collector after its synthetic checks. No application code, request headers or security settings were changed. Raw follow-up records and test log remain ignored under .codex/cockpit-followup/. The first 25 rendered pages are pixel-identical to the earlier reviewed revision; the changed appendix page was visually inspected and structure/link checks passed.

Next laptop: preserve edits, fetch and safely switch to `task/final-report`, pull `--ff-only`, verify the artifact/evidence revisions above and read root HANDOFF. Review/signature handling remains with the students. Do not merge the lab branch or main automatically. Transfer writing ownership only after a confirmed push; final branch-head parity is checked outside this file, while the immutable report/evidence revisions remain recorded here.
