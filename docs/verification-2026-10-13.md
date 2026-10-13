# FaultNet fresh verification — 13 October 2026

## Scope and checkout

The user requested the previously omitted visual/accessibility, Wireshark, other-laptop, and repeat Packet Tracer checks. These observations were made on the current Windows laptop against application commit `1780cf335145bba04ffaf9d1e05a495cf3ecdc4f` on `task/faultnet-mvp`. No application code was changed. The existing tip's Windows CI passed in [run 38292095805](https://github.com/Pranav-Suresh1024/FaultNet/actions/runs/38292095805).

The audit's local `npm test` run passed all 27 tests in about 18 seconds before this verification. That test result does not resolve the audit findings listed below. The app initially was stopped; `npm start` succeeded and the dashboard reported Demo and Storage ready.

## Dashboard and bounded accessibility checks

| Check | Observed result |
| --- | --- |
| Desktop render and real statistics | Saved bandwidth run reopened with faulty median **2016.7 ms**, mean throughput **31.7 KiB/s**, and observed recovery **234.3 ms**; chart and comparison table matched the stored summaries. |
| Responsive reflow | At CSS widths **360 px** and **320 px**, document width equalled viewport width. At 360 px, the chart had a 294 px scroll region / 540 px content and the phase table 294 px / 580 px. Temporary viewport overrides were reset. |
| Chart keyboard scroll | ArrowRight moved chart scrollLeft by 40 px. Focus had a visible accent outline. |
| Navigation keyboard focus | Tab reached the brand and sidebar links with visible white outlines. Enter on New experiment navigated to its anchor below the sticky header. |
| Start/Stop via Enter | An 8 KiB/s run was stopped during a faulty transfer. Record `473940ab-d3ff-44fe-9dc5-cc4dfb272212` is `stopped`; its cancelled probe received 39,936 bytes, has `successful: false`, and no invented recovery duration. UI returned to idle / fault none, with Start enabled and Stop disabled. |
| Accessible naming | No unlabelled input/select/button was found in the inspected DOM. Tables had captions/row headers; the SVG exposed actual phase values in its accessible name. This is structural inspection, not a screen-reader run. |
| Selected rendered contrast | Muted metric notes on white: **5.50:1**. Current navigation white text on its rendered background: **11.11:1**. These sampled pairs do not cover every state/color. |
| Browser errors | No error-level console entries were observed during these checks. |

True 200% browser zoom was **not verified**: the in-app shortcut did not change the measured viewport, and the separate Edge localhost attempt was blocked by the browser client (`ERR_BLOCKED_BY_CLIENT`). No bypass was attempted. Full screen-reader use, every keyboard path, and complete accessibility certification remain unverified.

## Actual Wireshark capture and packet analysis

Wireshark/TShark 4.6.9 and Npcap loopback were available. A bounded 40-second `dumpcap` capture used only:

```text
host 127.0.0.1 and (tcp port 3001 or tcp port 3002)
```

It captured **871 packets**, reported **0 capture drops**, and contained **0 packets on control port 3000**. This fresh explicit verification supersedes the earlier capture-permission limitation. An earlier 60-second attempt contained zero packets because the experiments were outside its useful capture window; it is retained as a failed evidence attempt, not counted as scenario evidence.

The successful capture covered four sequential local experiments, not four separate files. Common settings were **2 probes per phase**, **100 ms wait**, **5000 ms timeout**, with three-success recovery. These are smoke-check samples, not a statistically sufficient performance study. Times below are UTC; actual captured traffic spanned approximately `03:41:03.519Z`–`03:41:10.457Z`.

| Scenario and local run ID | Application result | Packet observation |
| --- | --- | --- |
| Baseline `5ccc0502-37f2-47e9-b312-6bec279105b7` | 2/2 complete 65,536-byte responses; median 8.3 ms | HTTP GET `/payload` and HTTP 200 response exchanges on proxy/demo connections. |
| 500 ms delay `03593550-14c3-4c61-8dcf-3e512ece27c8` | Faulty 2/2 success; median 514.4 ms; recovery 3/3 success | Proxy HTTP response times in streams 11 and 13 were 0.5123624 s and 0.5075463 s; upstream demo responses were under 1 ms. |
| 32 KiB/s bandwidth `5376a748-c90e-4609-bc12-616c78bc4c22` | Faulty 2/2 success; median 2016.7 ms; mean throughput 31.7 KiB/s; recovery 3/3 success | Proxy HTTP response times in streams 26 and 28 were 2.0187325 s and 2.0089890 s, consistent with delayed full-body delivery. Upstream demo delivery remained quick. |
| Interruption `d8763a08-6074-486b-b857-cccc91d94375` | Faulty 0/2 success; median/throughput null; recovery 3/3 success | Streams 41 and 42 contained GET requests but no HTTP responses. Both sides closed with FIN; no RST was observed. Recovery exchanges returned HTTP 200. |

TShark reported no retransmission matches in this capture. Zero capture drops concerns the recorder; it is not a network-loss measurement. HTTP interruption here is not proof of TCP resets or IP packet loss. Packet capture and application elapsed timers use different boundaries; their numerical values need not be identical.

Raw captures, generated records, and screenshots remain ignored local evidence. Only this reviewed observation summary is shared through Git. See [Wireshark guide](wireshark-guide.md) for the reproducible procedure and display filters.

## Fresh Packet Tracer OSPF run

Git fetch confirmed `origin/task/packet-tracer-labs` at `9f72386cf4a1ae30ccd50ba7c0a1a403b3178229`, containing static, RIP, and OSPF projects. Fresh source copies matched these size/hash values before opening:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `FaultNet-static.pkt` | 61,871 | `76043a0d69ff1256bc41ac1099418abf3acc0715caa4af6a370eba9f99a15f0b` |
| `FaultNet-rip.pkt` | 61,915 | `14941527fcea9c90350de0fc0f9b3c4d5ac70bae704dc3e7f3503c3cdd7f0903` |
| `FaultNet-ospf.pkt` | 61,998 | `2d162670c54a51ec5a489bc9d9219de05ca4d516ee77b846ed370f77e2fd7c8f` |

The fresh dynamic rerun used the OSPF project in Packet Tracer 9.0.1, PC1 → PC3 (`192.168.1.2`):

| Phase | Ping | Live evidence |
| --- | --- | --- |
| Initial warm-up | 3/4 replies | One timeout during startup; not hidden or treated as stable failure. |
| Settled baseline | 4/4 replies | R1 route to `192.168.1.0/24` was `[110/2]` via `10.0.0.2`, G0/0; replies TTL 126. |
| R1 G0/0 disabled | 4/4 replies after settling | Interface administratively down; OSPF adjacency FULL → DOWN. Route changed to `[110/3]` via `10.0.0.9`, G0/1; replies TTL 125. |
| G0/0 re-enabled | 4/4 replies | Link indicators returned green and replies returned to TTL 126. One restored reply took 12 ms; remaining replies reported under 1 ms. |

The initial console shutdown attempt was ineffective because the pager consumed a character; it was not counted as fault evidence. The fault and restoration were applied through the interface Config checkbox and verified. Fast Forward Time was used, so this check does **not** measure wall-clock convergence duration. Static and RIP were not dynamically rerun in this fresh pass; their previous bounded results remain in [the independent lab review](packet-tracer-review.md).

No teammate lab file was edited, merged, or pushed by this verification. The reviewed simulator copy and transcripts are local only.

## Two-laptop status and remaining work

The user confirmed **two active laptops**; the third is inactive and is excluded from R19. The uploaded lab branch proves the teammate's Git push reached GitHub and allows local review of those files. It does not prove their application checkout, Node version, `npm test`, browser, or capture permissions. Those other-laptop runtime checks remain open; only the current laptop is directly accessible here.

The preceding audit findings remain open: recovery-record validation can accept recovery probes before fault clearance; a corrupt comparison can leave Start disabled until Refresh; individually valid UI settings can exceed the combined probing budget without a helpful explanation; and active bandwidth-body cancellation lacks a committed regression test. The fresh GUI cancellation passed once but does not replace that test. The obsolete README cloud `main` push example also remains for a separate cleanup.

The proposed additional dashboard cases, charts, and customization are not implemented or approved by this verification. No lab merge, main integration, deployment, or code fix was performed. Next: address the audit findings, obtain the other active laptop's runtime evidence, and complete report/release review.
