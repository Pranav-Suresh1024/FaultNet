# FaultNet final report handoff

Updated: 27 October 2026, Asia/Kolkata.

## Deliverables and ownership

- Latest revision: replaced all documentation/RFC/repository bibliography entries with six published papers, each with a verified publication DOI and a freely available complete PDF. Literature review and its comparison table, reproducibility discussion, packet interpretation and novelty citations now match those studies. DOI metadata came from Crossref; full PDFs were retrieved without authentication and checked for title, page count, full text and references. Author manuscripts are labelled where used. GitHub remains in section 9.1 only. See [reference metadata](scholarly-references.json) and [verification evidence](evidence/reference-verification.json).

- Branch: `task/final-report`, renamed locally and on GitHub at the user's request; application baseline `313822e` on main. This laptop owns this documentation/report task. Final pushed commit and remote parity are reported in the transfer message, outside this file.
- [Final editable Word report](FaultNet-final-report.docx) and [matching PDF](FaultNet-final-report.pdf): 29 pages, 16 editable tables, eleven figures and an automatic contents page.
- The course template's twelve main sections, supplied cover/logo, filled student details, supervisor and unsigned declaration are retained. The complete-report request restores the template's contributions/results/reference material. Both dashboards, practical applications, fault mechanisms, code modules, architecture, experiments, critical evaluation and GitHub link are covered.
- No narrative dates, AI-agent mentions, draft placeholders or “yet to be implemented/out of scope” language in the report. Technical timestamps within the reviewed interface image remain evidence. The user's partial report is preserved byte-for-byte, including their pre-existing local revision; this revision is included as the source checkpoint.
- `src/`, `public/`, application contracts, packages and teammate lab files are unchanged. Existing records/exports already expose the required metrics. No added dashboard feature or backend change was necessary.

## Evidence and findings

The [evidence guide](evidence/README.md) gives settings, definitions, provenance and reproduction steps. Shared evidence is reviewed JSON/CSV aggregates plus selected figures/screenshots; raw records and captures remain ignored.

| Measurement | Observed result |
| --- | --- |
| Accepted workbench dataset | 100 validated saved runs; 1,300 phase observations; ten runs and 50 faulty attempts per condition |
| Attempted record quality | 101 attempts, one validation/persistence rejection, repeated condition retained separately |
| Direct/proxy overhead study | 50 direct + 50 proxied requests; median paired block cost 2.32 ms |
| Delay calibration | 1,500 ms setting adds 1,506.52 ms; paired calibration error 0.43% |
| Rate calibration | 15.96 / 31.81 / 79.12 KiB/s at configured 16 / 32 / 128 KiB/s |
| High-rate limitation | 128 KiB/s condition attains 61.81% of its cap; timer/scheduling cause is plausible, not isolated |
| Timeout intervention | Same 1,000 ms delay: 0/50 completion at 500 ms deadline, 50/50 at 2,000 ms |
| Live study | Eight conditions × ten requests; delay/jitter/rate/status/disconnect/stall/mock plus normal; final reset returns 200 and 65,536 bytes |
| Packet evidence | 55,392 packets; zero control-port packets; 15 linked request/probe pairs across delay-500, delay-1500 and bandwidth-32 |
| Reviewed routing evidence | Settled fault batch: static without backup 0/4, RIP 4/4, OSPF 4/4; alternate next hop R3 |

One rejected bandwidth-32 run (`37685c85-894a-4c9c-a3d2-0b5d6c921fce`) had 537 ms of UTC recovery interval versus 534.6247 ms monotonic duration. The 2.3753 ms difference exceeded the validator's 2 ms tolerance. Preserve the local rejected record and count: do not silently classify it as a valid saved run or erase it. The application is unchanged. A follow-up fix needs a regression test and a careful clock/chronology policy; simply loosening chronology checks would weaken evidence validation.

## Completed verification

- `npm test`: **61 passed, zero failed/cancelled/skipped**, Node 22.23.1; elapsed 18.323 seconds. Tests ran after measurement collection to avoid benchmark interference.
- `node --check scripts/evaluate-report.mjs` and Python compilation of authoring/analysis scripts passed.
- `scripts/analyze-report.py`: validates accepted counts/state and formula self-checks; creates aggregate tables and plots. Successful timing, failed duration and cancellation denominators remain distinct.
- `scripts/correlate-report.py`: TShark decode passed; checks unique stream matches, response request-frame linkage, GET/first-data/reassembled-response order and agreement with probe timing. `capinfos` confirms 55,392 packets. Capture has no interface statistics block; capture-drop count is unknown.
- `scripts/export-report.ps1`: Word repagination, automatic contents refresh and PDF export passed.
- `scripts/verify-report.py`: twelve main sections, 31 headings, 16 native tables, twelve embedded images including the logo, 29 nonblank PDF pages, expected numeric values, no draft/date/AI-agent prose, valid contents/cross-reference fields, no tracked changes/comments, unchanged user source. It also checks all six numbered scholarly citations, DOI/full-text links and GitHub placement. Approximately 6,100 extracted words.
- Every final PDF page was rendered at 100 dpi and visually inspected, including the revised literature review and bibliography. Contents links, page numbers, captions, figures, units and body legibility reviewed. All fifteen unaffected tables and all image bytes match the pre-reference-revision report. The saved report was updated in its existing Word tab; a local backup preserves the preceding version. No new application/lab tests or measurements were run for this reference-only revision.
- Selected evidence and repository diff reviewed before staging. Push/remote confirmation is completed in the final transfer message, not assumed by this file.

## Boundaries and local evidence

Fresh browser screenshots could not be taken: Computer Use stopped because it could not confidently verify the browser URL. That restriction was not bypassed. The report labels the earlier reviewed workbench/topology screenshots as representative. Live proxy metrics and fresh packet timings were collected independently through the protected API and CLI. No fresh browser visual/accessibility pass or fresh Packet Tracer GUI rerun is claimed. Simulator evidence remains the bounded review of lab commit `9f72386`, with transient losses and Fast Forward Time limitations retained.

Local-only files: `.codex/final-report/evaluation.json`, `rejected-run.json`, `evaluation.pcapng`, `packets.tsv`, `tests.txt`, `verification.json`, rendered page PNGs, preserved `user-source.docx` and analysis packages. Their paths are examples relative to this checkout; other laptops do not receive them through Git. Session capability tokens are not saved in the shared evidence. The controlled app is left running with experiment fault cleared and original normal live configuration restored; stop it with Ctrl+C when finished.

Reference-revision backups, downloaded full papers, Crossref responses and rendered QA pages are local under `.codex/report-references/`. Only the reviewed citation metadata and verification summary are shared. The open Word owner/lock file is deliberately excluded from the commit.

## Next laptop

1. Preserve local edits; fetch origin and switch to `task/final-report` only when safe. Pull `--ff-only`, verify the transfer SHA, then read root `HANDOFF.md` and this file.
2. Open the final DOCX for permitted editorial changes and the PDF for stable submission/printing. The existing partial remains the source checkpoint. The report needs ordinary student review/signature handling; no signatures were fabricated.
3. Keep the teammate's `task/packet-tracer-labs` branch separate. No lab merge, main merge, deployment or other-laptop validation is implied by this report checkpoint.
4. Further application work is a separate task. Priorities supported by this evaluation are the recovery clock-validation boundary and high-rate pacing calibration, with meaningful tests. Do not alter the published evidence without re-running and relabelling a replacement evaluation.
5. R20's report component is complete; full rehearsal/release acceptance and R19's other-laptop runtime checks remain independent gates. The user requested the handoff, not an automatic main merge.
