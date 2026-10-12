# FaultNet handoff

Updated: 13 October 2026 (Asia/Kolkata).

## Current state and authorization
- The user asked to start implementation after the concrete technical proposal was presented. Application contracts are approved and implementation is resumed; the earlier roadmap preparation pause is superseded.
- The application and the approved reference-inspired UI redesign are on task/faultnet-mvp. The UI update is based on 675ce81 and the user explicitly requested staying on this branch. Main retains the preceding documentation baseline; no merge/public deployment has been performed.
- Repository: https://github.com/Pranav-Suresh1024/FaultNet. Documentation, Git setup, application/test coding within approved contracts, commits, and branch pushes are authorized. All coding is performed by AI agents.
- The user reports the teammate is setting up Packet Tracer and has created a separate branch with .pkt files; origin/task/packet-tracer-labs is observed. The user approved this laptop's UI work on the existing branch. This checkout owns public/, UI tests, and shared design/context; do not edit/merge lab work. Reconcile any shared-context conflicts during reviewed integration. Other-laptop application operation/access remain unverified.
- The user subsequently requested review of the uploaded .pkt files and Wireshark instructions. Lab commit 9f72386 was reviewed using ignored local copies in Packet Tracer 9.0.1; static/RIP/OSPF baseline/fault tests and restored reachability matched the intended demo. No lab merge or source changes were made. See [independent review](docs/packet-tracer-review.md) for bounded results and startup transients.
- Wireshark is now installed: TShark 4.6.9 and Npcap loopback interface discovery were verified here. Automatic approval review rejected an attempted five-second synthetic capture as blocked by policy; capture permissions and actual captures remain unverified. The user performs the capture using [the guide](docs/wireshark-guide.md).
- Writing ownership may transfer after the push is confirmed and the next laptop is explicitly identified as writer. Verify the branch SHA rather than relying on chat history. The final report contains the checkpoint commit; do not put this commit's own SHA in this file.

## Implemented application
- Node.js 22.23.1 ES modules, zero external packages, plain browser UI, local schema-v1 JSON. package.json/package-lock.json/.node-version are configured.
- One process with loopback control 3000/demo 3001/proxy 3002. GET /payload returns 65,536 synthetic F bytes. Proxy accepts only the fixed demo path/target.
- Baseline or baseline/fault/clear/recovery runs, bounded delay/throttling/interruption, one active run, cancellation, three-success/15-second recovery, and a 120-second probing deadline.
- Validated records, atomic phase/terminal saves, restart interruption labels, explicit unsaved evidence, safe JSON/CSV exports, protected result APIs.
- Reference-inspired dashboard: charcoal sidebar/topbar, four real measurement cards, accessible phase-median SVG chart, compact settings, state labels, saved compatible/incompatible comparisons, and capability-protected downloads. Missing measurements remain null/—; chart labels absent successful probes instead of plotting zeros. Backend APIs/record schema remain unchanged.
- See docs/implementation-contracts.md for exact approved values; docs/implementation-progress.md for verification/review rulings. Roadmap R02-R14 are In review on the task branch, not integrated Done. R01's lab portion remains open.

## Checks and results
- npm test: PASS, 27 tests, 0 failures, about 18 seconds. New dashboard phase-selection/chart-data test preserves missing values and real zeros; existing async regression still passes. No external test packages.
- Latest full-run calibration: five baseline/five 500 ms delay samples gave median difference 513.2 ms (400–800 ms bound). Three 32 KiB/s probes each received 65,536 bytes with 31.79/31.82/31.71 KiB/s (24–36 bound).
- Recovery-window exhaustion: PASS, full 15-second observation without inventing a confirmation/duration.
- API regressions: hostile Host/Origin, missing/Unicode capability, missing mutation Origin, canonicalized/absolute-form paths, invalid/oversized input, rate limits, and asset/path restrictions.
- Persistence/lifecycle: reopen, corrupt/unsupported records, interrupted restart, summary/chronology checks, failed writes, failed-save shutdown, port collision cleanup, five-second incomplete-header closure.
- Original independent review prompted fixes for authorization, chronology, timeouts, shutdown persistence, and async races. UI redesign review found a sidebar focus contrast issue; white focus outlines fix it. No other critical/important regression was found in the reviewed UI scope. Full screen-reader/accessibility certification remains unverified.
- npm start: PASS; app currently running locally at http://127.0.0.1:3000. No extra dependency install required.
- Redesigned UI browser checks: empty state, saved delay reopening, keyboard navigation/Enter start, real interruption and bandwidth runs, delay-stop with cancellation/fault clearance, compatible/incompatible comparison, and JSON/CSV downloads. A completed bandwidth run displayed 2012.4 ms median and 31.8 KiB/s, matching measured summary values. Interrupted faulty phase displayed 0% availability and no successful-probe timing bar.
- No browser error-level console entries observed. Narrow viewport observed 375 px with equal page width and chart scroll region 310 px / 540 px content; keyboard ArrowRight moved chart scroll by 40 px. Desktop/narrow responsive checks use temporary overrides, reset after testing. Full keyboard paths, browser version, screen reader, and zoom remain unverified.
- Selected color contrast checks: white/accent 5.73:1, muted text/white 5.50:1, muted text/canvas 5.00:1. Sidebar focus is white against charcoal, observed via keyboard. These are bounded checks, not a full accessibility certification.
- git diff --check: PASS. Earlier local-link/heading-anchor audit passed across 14 Markdown files; this documentation update's local-file link check passed across all four changed documents. Application tests were not rerun for this documentation-only update.
- UI checkpoint Windows CI: PASS for 9958d8d in [run 38287879296](https://github.com/Pranav-Suresh1024/FaultNet/actions/runs/38287879296), rechecked during lab review. A later documentation tip has its own CI; verify its run after push.
- Packet Tracer review: source file SHA-256/size parity, addressing/configuration assertions, actual saved-file opening, PC1-to-PC3 baseline/fault/restoration checks, and live RIP/OSPF route tables passed within the scope in docs/packet-tracer-review.md. Fast Forward Time was used; no exact convergence-time claim. Raw simulator transcripts/review copies are ignored local evidence.

## Open gates and next action
1. Verify CI for the current tip, then review/integrate the pushed task checkpoints when authorized. UI checkpoint CI passed; lab branch 9f72386 has a bounded independent review. No merge has been requested/performed; reconcile shared-document differences during integration.
2. Confirm actual laptops/access and user-selected active writer. New clones must fetch/switch to task/faultnet-mvp because main lacks this implementation. Follow README.md; pull --ff-only only on a clean matching branch and preserve diverged/local work.
3. Follow docs/wireshark-guide.md to collect baseline/delay/bandwidth/interruption captures and matching application exports. Installation/interface discovery passed; capture permissions and observations remain pending. Packet Tracer 9.0.1 static/RIPv2/OSPF demos were reviewed; course coverage/rubric and exact deadline (working interpretation 13 Oct 2026, 23:59 IST) still require confirmation.
4. Verify a fresh checkout on all three laptops (R19), then complete reviewed lab/report/demo/release work (R20). Friend needs accepted collaborator write access to push to a private repo; owner grants access, credentials are not shared.

## Local-only evidence and limitations
- Earlier synthetic browser records remain intact, alongside other locally created records. This UI QA added interruption e7a07a68…, bandwidth 69dd4477…, and stopped delay a9696e75… under ignored results/. They are local application measurements, not network-lab evidence or a source-sync backup.
- QA JSON/CSV downloads are in this laptop's Downloads folder. Updated dashboard preview is ignored .codex/faultnet-dashboard.jpg. No records, captures, or screenshots are staged/pushed.
- Packet Tracer review copies and simulator transcripts are in ignored .codex/packet-tracer-review-9f72386/. Original teammate files remain on the lab branch; local saved review files include test history and restored links. Only the reviewed Markdown summary is shared. No Wireshark capture was created by the rejected action.
- Phase-boundary saving can lose latest in-phase observations after a hard crash. Failed-save evidence exists only in memory until exit; download before closing. Power-loss durability, exhaustive browser/security audit, Node 24, and other laptops remain unverified.
- Raw captures, credentials, Codex account/session data, and generated records remain outside Git. Deliberately review/sanitize/transfer evidence separately when authorized.
