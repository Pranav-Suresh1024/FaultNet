# FaultNet final report handoff

Updated: 28 October 2026, Asia/Kolkata. Branch: `task/final-report`.

## Current deliverables

Use [the revised editable report](FaultNet-final-report-revised.docx) and [matching PDF](FaultNet-final-report-revised.pdf). These supersede the earlier final report for submission review. Earlier final/partial reports remain unchanged. The latest saved and unsaved edits to the revised report were backed up locally and preserved before this correction. The twelve course sections and their order, cover/logo, student details, supervisor and unsigned declaration are preserved. The abstract stays in its template position. Revised length: 27 pages, 16 editable tables, thirteen figures plus logo, 31 headings and 6,677 extracted words. Contents includes all seven performance subsections; the procedural appendix is removed. The user’s current cover/declaration dates and prose edits are retained.

No application, package, runtime contract or teammate lab changes. No main merge or deployment is authorized by this report checkpoint.

## Immutable revisions and checksums

- Application: `313822e58f7d4420550a1836ebe949dc4727b88c`.
- Evaluation scripts and numerical evidence: `515ff591e4433c98021599623c0b14664f17329a`.
- [Permanent evidence snapshot](https://github.com/Pranav-Suresh1024/FaultNet/tree/515ff591e4433c98021599623c0b14664f17329a/docs/reports/evidence).
- Revised report/document scripts: `86de2b2dba5910f3526872efe6059ba2154449f0`.
- [Permanent revised report snapshot](https://github.com/Pranav-Suresh1024/FaultNet/tree/86de2b2dba5910f3526872efe6059ba2154449f0/docs/reports). This handoff-only metadata update follows that immutable artifact commit, avoiding a self-referential hash.
- Reviewed lab: `9f72386cf4a1ae30ccd50ba7c0a1a403b3178229`, Packet Tracer 9.0.1; separate `task/packet-tracer-labs` branch, unmerged.

SHA-256 of the final revised files:

```text
DOCX 844bb6a78e34414665945217a065118f958f2ba19e417812243bb44c6a650bd5
PDF  8ec75a9e84ac7193a52363a8dae5f35387fb2c534e149fad1f1736a8b88fae18
```

Field refresh or a Word save can change binary hashes; compare downloaded files before opening/resaving. Rebuilds are expected to preserve content/statistics, not necessarily binary hashes.

## Review changes and verification

- Table 14 now distinguishes completed requests from completed HTTP-200 requests, and labels median attempt duration, including failures. Table 10 labels successful timing and mean per-request goodput. Request success rate replaces the statistical use of availability; application schema keys are unchanged.
- Zero-delay calibration includes 14.61 ms paired added time and its interval. The separate 2.32 ms direct/proxy comparison is explained; timer scheduling remains a hypothesis, not an established cause or a correction factor.
- Bootstrap procedure states 95% percentile interval, 3,000 resamples, seed 308 and ten run-level differences, with five faulty requests within each run.
- Shared `analysis-inputs.json` holds only original numerical analysis columns, flags and synthetic settings. Running analysis against it reproduced every prior summary value exactly: 100 accepted runs, 1,300 phase observations, 100 overhead durations and 80 live samples. No raw persisted records, capture, capabilities or wall-clock observation timestamps were committed.
- Rejected-run disclosure, high-rate 61.81% attainment, HTTP-versus-IP distinction, three-success recovery policy and refusal to rank routing convergence speed are preserved. All ten recovery conditions appear in Table 13. Live Figure 10 shows individual observations, not median bars alone.
- Capture drops are explicitly unknown in the report. Packet Tracer version/full lab revision and reviewed route excerpts/ping summaries support the layout image without inventing a fresh simulator run.
- Table 1 compares layer/faults, automation/evidence/persistence and limitations, including FaultNet. Contributions are more concrete and limited to documented responsibilities. The six scholarly references now use standard author/title/venue/year citations with inline DOIs. Full-text and Stanford access URLs remain only in verification metadata, not in the report. GitHub/evidence links remain outside References.
- Unnecessary forced page breaks removed; all 27 final pages rendered at 100 dpi and visually inspected. Tables remain editable with repeated continuation headers; no clipping/overlap or broken navigation found. The root README distinguishes document generation, numerical recalculation and replacement experiments; the report retains the scientific methodology and evidence provenance.
- `scripts/verify-report.py` passed all structure, measurement, link, contents, source-preservation and no-draft/prose checks and preservation of user-edited front-matter dates. All eight external links (six DOIs, repository and pinned evidence) survived PDF export. Scholarly publication/access checks remain the previously recorded verification; this revision does not claim a fresh web check. Changed Python scripts compile successfully. `git diff --check` passed; application files match the pinned baseline.
- Fresh follow-up: 61/61 tests passed, zero failures/skips/cancellations, Node 22.23.1, 18.073 seconds. The existing collector ran with one round and separate local output: ten accepted saved workbench runs / 130 phase observations (50 baseline, 50 faulty, 30 recovery), no rejected records and recovery confirmed in all ten. Interruption and the 500 ms deadline gave 0/5 faulty successes; other cases gave 5/5. Eight live scenarios produced 80 requests; HTTP 503, disconnect and stall outcomes matched their intended mechanisms, and reset returned HTTP 200 / 65,536 bytes. See evidence/followup-verification.json. Original study inputs/aggregates are unchanged; the confirmation batch is described separately in section 9.2. No fresh capture or simulator execution.

## Reproduction modes

See the [root README](../../README.md#report-and-evaluation-reproduction) for run and reproduction commands and [the evidence guide](evidence/README.md) for numerical definitions and provenance.

1. **Generate the document from aggregates:** `python scripts/build-final-report.py`, then `powershell -File scripts/export-report.ps1`, then `python scripts/verify-report.py`. Uses committed figures/statistics and the current revised cover/declaration, falling back to the partial template when the revised file is absent. Default output is the revised pair. It neither runs experiments nor recalculates statistics. Needs python-docx/pypdf and Microsoft Word; save/close the intended output first.
2. **Recalculate numerical results:** `python scripts/analyze-report.py`, with matplotlib/numpy. Reads committed sanitized numerical inputs; no application or ignored raw evaluation file needed. Recreates workbench/live/overhead statistics, bootstrap intervals, CSV and eight analytical figures. Packet figure decoding and original chronology validation remain dependent on the local originals. Rejection/environment metadata are retained audit facts.
3. **Collect new evidence:** Node 22.23.1, `npm start`, then `node scripts/evaluate-report.mjs` on an idle setup. Retain rejected records and inspect before resume. `python scripts/prepare-report-inputs.py` projects a new shareable numerical dataset for review; analysis then uses that dataset. Fresh packet correlation additionally requires the covered raw capture and local records. A replacement study must be labelled and not silently combined with published observations.

## Remaining boundary and next action

The user supplied an actual cockpit screenshot, completing the report visual requirement. It is committed as evidence/screenshots/live-cockpit.png, with source/hash/dimensions in evidence/provenance.json. The report includes the full view (Figure 8, page 19) and a readable native Word crop of the same monitor (Figure 9, page 20). Original PNG bytes are preserved, not regenerated. The rolling 50-request counters are labelled as a separate snapshot; they are not substituted for study totals or interpreted as current packet loss. The earlier automated browser rejection/paused-response diagnostics remain historical facts; this image does not establish an automated UI/accessibility pass. No further screenshot is required for the report.

The report documents, but does not fix, the recovery UTC/monotonic validation boundary or the high-rate pacing limitation. Other-laptop runtime checks, a new UI/accessibility pass, fresh Packet Tracer execution and full rehearsal remain separate gates. Local raw originals, rendered QA pages, backups and Word locks remain unshared. The live configuration was restored by the collector after its synthetic checks. No application code, request headers or security settings were changed. Raw follow-up records and test log remain ignored under .codex/cockpit-followup/. For the latest diagram/presentation revision, all 27 pages were visually inspected after field refresh; the diagram now has nine aligned boxes and differentiated HTTP/control arrows, and the delay chart shows calibration residuals with the original confidence intervals. Figures 1 and 3 are the only changed image assets. Structure/value/link, sequential figure-numbering, screenshot hash and native Word crop checks passed. All sixteen pre-existing tables and the other eleven figure assets plus logo are retained. The shared numerical datasets, summary and separate confirmation data are unchanged. A scratch rebuild confirms current front matter and user prose are preserved; modified Python scripts compile and README local links resolve. No new tests, experiments, captures or simulator execution were performed for these document corrections.

Next laptop: preserve edits, fetch and safely switch to `task/final-report`, pull `--ff-only`, verify the artifact/evidence revisions above and read root HANDOFF. Review/signature handling remains with the students. Do not merge the lab branch or main automatically. Transfer writing ownership only after a confirmed push; final branch-head parity is checked outside this file, while the immutable report/evidence revisions remain recorded here.
