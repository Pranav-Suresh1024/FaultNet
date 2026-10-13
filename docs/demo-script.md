# FaultNet demonstration script

Updated for the user's 30-mark rubric supplied on 14 October 2026. Allow 15–18 minutes for the full demonstration; for a shorter slot, show rehearsed bandwidth/interruption records and use the comparison run's own baseline instead of a separate baseline-only run. Keep the analysis, what-if evaluation, live cockpit, Wireshark and routing evidence. Instructions labelled **Do** are actions; **Say** is text you can read aloud. Replace bracketed values with actual observations. The current application baseline is main; the older appearance rollback/archive request remains paused.

## Rubric and two-person responsibilities

The assessment is individual: both people must understand all components and be able to justify results, even though they divide screen operation. A operates/explains the workbench and live cockpit; B explains packet evidence and operates Packet Tracer. Wireshark runs on the application laptop; A can click while B explains. Use the [two-person script](two-person-demo.md) for speaking handoffs; this document supplies the rubric/evidence checklist and exact experiments.

| Category | Marks | Demonstration evidence |
| --- | ---: | --- |
| Understand | 3 | Sections 1–2: problem, objectives, proxy/HTTP/TCP, metrics and distinct purposes of all four tools. |
| Apply | 5 | Sections 3–10: real fault injection, saved results/exports, live requests, packet capture and routing configuration. |
| Analyze | 7 | Sections 4–9: measured baseline changes, expected versus observed delivery time, timestamp/stream interpretation and changed routing-table entries. |
| Evaluate and higher | 10 | Sections 11–12: one-variable what-if experiment, evidence-based judgments, design tradeoffs, limitations and proposed improvements. |
| Complete and correct report | 5 | Submission checklist below: methodology/settings, traceable results, screenshots/captures, analysis/evaluation and references. A demo script is not the finished report. |

Analysis and evaluation account for 17 marks. For each main case, state the hypothesis, show the actual result, then explain the conclusion and its limits; do not spend the whole presentation naming controls.

## Prepare before presenting

1. Open the FaultNet project folder in File Explorer. Click its address bar, type `powershell`, and press Enter. If the application is not already running, enter:

   ```powershell
   npm.cmd start
   ```

   Keep this terminal open. If the site already works, do not start a second instance. A port-conflict message means another listener is running; do not terminate unfamiliar processes.
2. Bookmark the [experiment workbench](http://127.0.0.1:3000/workbench) and [live cockpit](http://127.0.0.1:3000/). Start the presentation on the workbench. Its status must say `Demo: ready` and `Storage: ready`. These are two pages of one application, with independent fault controls.
3. Rehearse baseline/delay/bandwidth/interruption using three probes, 250 ms wait and 5000 ms timeout. Section 11 intentionally changes timeout for its what-if comparison. Save each run's JSON/CSV and note its ID. Existing records remain in ignored `results/`; refreshing does not delete them.
4. Have Wireshark and the static/RIP/OSPF Packet Tracer projects ready. Do not switch this application checkout to the lab branch during presentation. Use separate .pkt files from the teammate or local review copies. On the current laptop, reviewed copies exist under `.codex/packet-tracer-review-9f72386/` in `static/`, `rip/` and `ospf/`; these ignored files do not transfer with Git. Originals are on `task/packet-tracer-labs` under `labs/packet-tracer/`.
5. Keep rehearsed evidence as a backup. The current laptop also has an earlier, separately labelled 871-packet capture at `.codex/verification-20261013/faultnet-scenarios.pcapng`. It contains earlier two-probe tests, not the three-probe presentation below. Do not present it as a fresh capture. The tiny `faultnet-loopback.pcapng` is an unsuccessful earlier attempt; use the scenarios file.

Editing a preset changes the scenario dropdown to **Custom settings**. This is expected: the edited values stay in place. Do not select the preset again afterward, because that restores its defaults.

Prepare one evidence sheet with run ID, payload, fault settings, probe count/wait/timeout, phase successes/eligible, median response time, mean throughput, confirmed/unconfirmed recovery and capture filename. Use the baseline from the same comparison run when calculating a fault's effect. Small smoke tests illustrate behavior; do not report statistical confidence or unmeasured protocol convergence speeds.

## 1. Introduce the project — 45 seconds

**Do:** Show the workbench without starting a run.

**Say:**

> Good morning. Our project is FaultNet, a network-resilience testing lab. A web application may work well under normal conditions but respond slowly or fail when its connection is delayed, bandwidth is restricted, or a connection is interrupted.
>
> FaultNet creates these controlled conditions, measures the effect on HTTP requests, removes the fault, and checks whether successful responses return. We also use Wireshark to inspect real packets and Packet Tracer to demonstrate routing behavior in a simulated network.

## 2. Explain the system and screen — 60 seconds

**Say:**

> The test client sends a request through a proxy to a local demo server. A proxy is an intermediary: it forwards the request and response, and it can introduce the chosen fault.
>
> Every test requests the same 64 KiB payload, or 65,536 bytes, so the comparison uses a consistent amount of data. The dashboard controls use a separate connection, which stays usable while the test traffic is impaired.

Point at the screen and explain:

| Screen item | What to say |
| --- | --- |
| Scenario preset | “A shortcut that fills in settings. It does not start the experiment.” |
| Mode | “Baseline only measures normal behavior. The comparison mode runs normal, faulty and recovery phases.” |
| Probes per phase | “A probe is one test request. Three probes means three requests in the baseline and faulty phases.” |
| Wait after each probe | “A 250-millisecond pause between requests. It is separate from the injected delay.” |
| Request timeout | “The client waits up to 5000 milliseconds, or five seconds, for a complete response.” |
| Availability | “The percentage of non-cancelled requests that completed successfully.” |
| Median response time | “The middle successful response time after sorting the measurements.” |
| Mean throughput | “The average delivered payload per second over successful requests, including their delay.” |
| Observed recovery | “The time from clearing the fault until three consecutive successful responses are confirmed.” |

**Say:**

> A dash means a measurement is unavailable or not applicable. It does not mean zero. These small runs demonstrate behavior; they are not a large statistical performance study.

## 3. Establish a baseline — 45 seconds

**Do:**

1. Choose **Healthy connection** in Scenario preset.
2. Set **Probes per phase = 3**, **Wait = 250**, **Request timeout = 5000**. Mode stays **Baseline only**.
3. Click **Start experiment**. Wait for **completed**.
4. Select **Baseline** in **Summarize phase** and point at the cards/table.

**Say before starting:**

> First, I will measure the normal connection. No fault is applied, and the client requests the same payload three times.

**Say after completion, using actual values:**

> Here, [number] out of three requests succeeded. Availability is [value] percent, and the median full-response time is [value] milliseconds. This gives us a baseline for comparison.
>
> Recovery is not applicable because this run did not inject a fault.

Expected under healthy conditions: 3/3 complete responses and 100% availability. Do not state those values if the screen shows otherwise.

## 4. Demonstrate delay and recovery — 90 seconds

**Do:** Begin a fresh Wireshark capture before this run, using section 8's loopback interface/filter. Then return to the workbench.

1. Choose **Mild delay**.
2. Change **Delay = 500 ms**, **Probes = 3**, **Wait = 250 ms**, **Timeout = 5000 ms**. Confirm Mode is **Baseline → fault → recovery** and Fault is **Response delay**.
3. Click **Start experiment** and let it complete. Stop and save the Wireshark capture as `delay-demo.pcapng` in a local evidence folder.
4. Inspect the baseline/faulty/recovery table. Select **Faulty**, then **Recovery** in **Summarize phase**.

**Say:**

> In this run, FaultNet first measures normal behavior. It then adds a 500-millisecond wait before forwarding each faulty request. Finally, it removes that delay and checks for three successful responses.
>
> The faulty median is [value] milliseconds, compared with [baseline value]. The increase is approximately the configured delay, plus normal processing overhead. These requests can still succeed: a slow connection does not necessarily mean an unavailable application.
>
> After FaultNet clears the fault, the recovery phase shows [actual outcome]. The application check confirms recovery after three consecutive complete responses. FaultNet is removing its injected fault, not repairing a physical network.

Expected: a roughly 500 ms increase in faulty full-response time, not an exact fixed total. Recovery confirmation is separate from each request's response time.

**Analysis:** Calculate `faulty median − baseline median = [difference] ms` using this run's two phase medians. Compare the difference with 500 ms and explain any discrepancy from actual observations. Read availability and successful counts alongside latency. If no successful timings exist, preserve that missing value; never calculate a difference from a dash.

## 5. Demonstrate restricted bandwidth — 60 seconds

**Do:**

1. Choose **Constrained bandwidth**.
2. Change **Rate = 32 KiB/s**, **Probes = 3**, **Wait = 250 ms**, **Timeout = 5000 ms**. Keep comparison mode.
3. Start and wait for completion. Select **Faulty** and point at throughput and the phase table.

**Say:**

> Bandwidth controls how quickly the response body is delivered. Here the proxy limits delivery to 32 KiB per second.
>
> The payload is 64 KiB, so delivery should take approximately 64 divided by 32, or two seconds, plus overhead. The measured faulty median is [value] milliseconds, and the mean throughput is [value] KiB per second.
>
> When the limit is removed, the recovery requests should return toward the normal behavior. This is application payload goodput; it is not a measurement of the Wi-Fi connection's maximum capacity.

Allow roughly 6–10 seconds for this small run. The preset normally uses 16 KiB/s; explicitly changing it to 32 makes the demonstration shorter.

**Analysis:** State the prediction before Start: `64 KiB / 32 KiB/s = 2 s`. Afterward compare the observed full-response time with that prediction and explain overhead/pacing. Do not confuse the 250 ms pause between probes with response latency or claim the result is interface bandwidth.

## 6. Demonstrate interruption and recovery — 60 seconds

**Do:** Choose **Complete HTTP outage**, set probes 3/wait 250/timeout 5000, and start the comparison. Select **Faulty**, then **Recovery**, after completion.

**Say:**

> This fault interrupts every faulty request's connection before the proxy forwards it. The baseline should succeed, the faulty phase should fail, and the recovery phase should succeed after the interruption is cleared.
>
> The faulty phase shows [actual successes] successful requests and [actual availability] percent availability. There is no successful-response latency here if every faulty request failed; that is why the timing card shows a dash.
>
> Recovery shows [actual outcome]. This demonstrates the difference between a connection that is merely slow and one that cannot complete the request.

If all faulty requests fail as intended, call this a controlled **HTTP connection outage**, not proven IP packet loss.

**Analysis:** Contrast the delay run's successful-but-slow responses with this run's failed exchanges, using actual counts. Failed attempt durations remain visible in the exact probe table even when successful-response latency is unavailable. A completed experiment does not by itself establish confirmed recovery; show its explicit recovery result.

## 7. Show saved results — 45 seconds

**Do:** Click **Download JSON** and **Download CSV** for a completed run. Scroll to the **Saved experiments** panel and select a previous run using **Open an experiment**. The sidebar now only links Workbench and Live proxy cockpit. Expand **Exact probe measurements** to connect a phase summary to its individual timestamps/outcomes.

**Say:**

> Each experiment is saved as a local JSON record containing its settings, timestamps, individual outcomes and summaries. Refreshing the dashboard does not delete that record.
>
> JSON retains the structured evidence. CSV is convenient for spreadsheet analysis. The charts are calculated from actual observations rather than predefined display values.

The **Compare experiments** dropdown requires matching protocol settings. The delay/bandwidth/outage runs above all use comparison mode, three probes, 250 ms wait and 5000 ms timeout, so they can be compared. The baseline-only run has a different mode and is deliberately incompatible with them.

## 8. Explain the Wireshark evidence — 90 seconds

Before the delay experiment, open Wireshark and select **Adapter for loopback traffic capture**. This captures traffic between processes on the same Windows laptop; the Wi-Fi interface is not the right interface for this localhost test. [Official loopback guidance](https://wiki.wireshark.org/CaptureSetup/Loopback).

In **Capture → Options**, enter this capture filter before starting:

```text
host 127.0.0.1 and (tcp port 3001 or tcp port 3002)
```

Start capture, run the delay comparison, stop capture and save it. The capture filter intentionally excludes dashboard control port 3000 and live cockpit proxy port 8080. Capture-filter syntax differs from display-filter syntax. [Official capture-filter guide](https://www.wireshark.org/docs/wsug_html_chunked/ChCapCaptureFilterSection.html).

For the presentation, open the delay-only capture and use the display filter:

```text
tcp.port == 3002
```

**Say:**

> Wireshark shows the actual TCP traffic carrying our HTTP requests. Port 3002 is the experiment client's connection to the fault proxy; port 3001 is the proxy's connection to the demo server. We excluded the control connection from this capture.

Select a request packet, then **Analyze → Follow → TCP Stream**. Show `GET /payload`, a successful HTTP response and the synthetic body. Close the stream dialog to examine packet-list timestamps. [Official Follow Stream instructions](https://www.wireshark.org/docs/wsug_html_chunked/ChAdvFollowStreamSection.html).

If HTTP is not decoded, use **Analyze → Decode As → HTTP** for TCP port 3002. To find requests, use `tcp.port == 3002 && http.request`. In a fresh capture containing only the three-probe delay comparison, the first three GET requests are baseline; the fourth is the first faulty request. Select that request, follow its TCP stream, close the dialog and compare its request/response timestamps. Keep the capture and the exported run's phase timestamps together.

Match the faulty probe's Started (UTC) timestamp to the captured request; UTC Date and Time of Day under View → Time Display Format helps align clocks. The fourth-request shortcut is invalid for a mixed capture or different probe counts. For bandwidth, identify the last response-body data as well as the first HTTP response; body completion is the relevant comparison with full-response elapsed time.

**Say only after checking the observed timing:**

> In this faulty connection, the time between the request and the first HTTP response is approximately [observed gap]. That supports the application's configured delay experiment. The dashboard measures the complete HTTP exchange, while the capture exposes the underlying packets. This gap is not TCP round-trip time.

Optional bandwidth/interruption captures use the same capture filter and settings. For bandwidth, inspect the duration of body delivery. For interruption, inspect incomplete exchanges and actual FIN/RST flags. Zero retransmissions or zero resets can be valid observations; neither should be invented to match an expected story. Follow TCP Stream alone shows contents, not proof of a timing difference.

## 9. Demonstrate routing in Packet Tracer — 2 minutes

**Say:**

> Packet Tracer is a separate simulation. It does not automatically receive FaultNet's settings or supply these dashboard results. We use it to demonstrate the related concept of reachability and recovery when a router link fails.
>
> The topology has three routers in a triangle. R3 provides an alternate route between the LANs behind R1 and R2. We compare static routing, RIPv2 and OSPF using the same topology, destination and failed direct link.

**Static routing:**

1. Open `FaultNet-static.pkt`. Allow interfaces/routing to settle. Open **PC1 → Desktop → Command Prompt** and enter:

   ```text
   ping 192.168.1.2
   ```

2. Show replies from PC3. Initial ARP/startup can cause a failed reply; retain it and repeat the ping.
3. On **R1 → Config → GigabitEthernet0/0**, uncheck **Port Status: On**. This disables the direct R1–R2 link. Do not delete the cable or choose the LAN-facing interface.
4. Repeat PC1's ping.

**Say, matching the screen:**

> This static-routing configuration has no backup route for the destination. After the direct link is disabled, the ping shows [observed failures]. A physically available alternate link is not enough unless the routing configuration uses it.

5. Re-enable the same interface and repeat ping to confirm restoration. Leave the original saved project intact; do not overwrite it with a faulted state.

**OSPF:**

1. Open `FaultNet-ospf.pkt`, allow it to settle and repeat the healthy PC1 ping.
2. Disable **R1 GigabitEthernet0/0** again. Wait for routing to settle; repeat ping and preserve any transient failures.
3. Open **R1 → CLI** and enter:

   ```text
   enable
   show ip route
   ```

4. Inspect the entry for `192.168.1.0/24`. In the reviewed fault scenario its alternate next hop was `10.0.0.9` via `GigabitEthernet0/1`, through R3. Show the actual current entry and successful pings rather than claiming a result from the topology alone.

**Say:**

> Here OSPF selects the alternate route through R3. These replies and the changed routing-table entry demonstrate reachability through another path. We have not measured an exact convergence time, so this is not a claim that one routing protocol recovers faster than another.

5. Re-enable R1's G0/0 and confirm ping again. If the GUI control is unavailable, the equivalent R1 CLI is `enable`, `configure terminal`, `interface GigabitEthernet0/0`, `shutdown`, `end`; restore using the same sequence with `no shutdown`.

RIPv2 is an optional third comparison: open `FaultNet-rip.pkt` and repeat the same test. It is already part of the reviewed lab set, but skip this repetition if presentation time is limited.

**Routing analysis/evaluation:** Include RIPv2 in the evidence sheet even if its live repetition is shortened. `R` identifies RIP and `O` identifies OSPF in `show ip route`. RIP uses hop count; OSPF uses cost/link-state information. Read the actual alternate next hop/interface and connect it to R1 → R3 → R2 on the topology. In this specific static control case there is no configured backup route; static routing can support backup configurations. An alternate physical path must also be usable by routing. Retain startup/ARP/convergence failures and distinguish them from a stable outage. If Fast Forward Time is used, disclose advancing simulated time; no wall-clock convergence comparison follows from it.

## 10. Live cockpit: manual testing and judgment — 90 seconds

**Do:** Open the live cockpit. Confirm Routing mode **Unified**, Application target **http://127.0.0.1:3001**; Apply target edits if needed, then **Reset faults** and **Clear monitor**. Reset retains the applied target. Leave Sample GET path **/payload** and send a normal sample. Next set **Response delay = 500 ms**, **Apply changes**, and send another sample; read its actual elapsed time/effects. Reset again. Click **Add** beside **Status injection**, set path prefix **/payload**, status **503**, probability **100**, then **Apply changes** and **Send sample**. Finally Reset faults and send a restored sample. Wait for each sample to settle before changing configuration.

**Say:**

> The workbench is for repeatable saved comparisons. This cockpit supports manual requests through an applied development-proxy configuration. Draft edits do not affect traffic until Apply. We showed [actual normal result], [actual delayed result] and [actual injected status], then [actual restored result].
>
> HTTP 503 is a valid HTTP response reporting an application error; that differs from a connection failing without a complete response. Using 100 percent probability makes this demonstration reproducible. Other controls support jitter, upload/download pacing, header changes and JSON mocks. The live controls are independent of the saved workbench experiments, and the monitor retains only the latest 50 finished requests in process memory.

**Evaluation:** Explain why saved automated comparisons and manual development testing need different workflows. Live monitor entries are a rolling window, not a durable experiment archive; use workbench exports for repeatable evidence. Named network presets are illustrative settings, not measured carrier performance.

Do not use the live cockpit's 60-second timeout mode in a short presentation: its sample request stops waiting after five seconds, which is a separate client limit. The synthetic demo exposes only `/payload`; its root `/` is not a frontend page.

## 11. Controlled what-if: does a longer timeout solve delay? — 90–120 seconds

**Question/hypothesis:** With a fixed 1000 ms injected delay, increasing the client timeout from 500 ms to 2000 ms is expected to allow more faulty requests to complete, while the delay itself remains. Verify the actual outcome; a busy system can differ from this expectation.

**Do:** Use comparison mode and Response delay. Set Delay **1000 ms**, Probes **3**, Wait **250 ms**, Timeout **500 ms**; Start and retain this run/export. Use **Reuse selected run settings**, change only Timeout to **2000 ms**, and Start the second run. Keep the payload/fault/probe count/wait unchanged. Read the Faulty phase for both records from saved results or their exports. These settings are both within the server's combined budget.

| Evidence to fill in after running | 500 ms timeout | 2000 ms timeout |
| --- | --- | --- |
| Run ID | [actual ID] | [actual ID] |
| Faulty successful / eligible requests | [actual count] | [actual count] |
| Faulty availability | [actual %] | [actual %] |
| Median successful full-response time | [actual ms or —] | [actual ms or —] |
| Failed attempt outcome/duration | [actual observations] | [actual observations] |
| Recovery confirmed? | [actual outcome] | [actual outcome] |

The Compare experiments dropdown deliberately treats these runs as incompatible because their timeouts differ. Use the evidence table/exports for this intentional one-variable evaluation; do not misdescribe that guard as a broken comparison. Use rehearsed records if time is short and label them as prior runs.

**Say after observing the results:**

> We changed only the timeout. The 500-millisecond case produced [actual outcome]; the 2000-millisecond case produced [actual outcome]. A longer timeout [did/did not] improve completion in these observations. It did not remove the configured delay. Allowing clients to wait longer trades quicker failure detection for more tolerance; the appropriate timeout depends on the application's response requirements.

This is a designed what-if experiment, not a measured optimization of the underlying connection. Do not claim a universally optimal timeout from three probes or compare a missing successful median as zero.

## 12. Justify choices, evaluate limitations and improvements — 60–90 seconds

**Both presenters should be able to explain:**

| Decision | Evidence-based justification / limit |
| --- | --- |
| Proxy interception and separate control port | Faults change real test traffic while control requests remain separate; this does not impair the entire laptop's network. |
| Fixed 64 KiB payload and controlled settings | Keeps comparisons reproducible; results are specific to this local workload. |
| Median plus counts, percentiles and exact probes | Median summarizes successful timings, while counts expose failures. Three samples and their p95 remain descriptive, not a statistical guarantee. |
| Three-success recovery check | Requires repeated successful responses after clearance; the duration includes probing/waits and is not routing convergence time. |
| Static/RIP/OSPF comparison | Same simulated topology/failure makes path-choice observations interpretable; current evidence does not rank protocol convergence speed. |

**Say:**

> Our evidence supports controlled HTTP fault injection and observed restoration for this local workload, together with alternate-route behavior in Packet Tracer. Limits include the small sample size, synthetic payload, local environment and separate simulation. HTTP interruption does not establish an IP packet-loss rate. Future evaluation could use larger repeated samples, different payload sizes, a configured development application, and carefully timestamped routing convergence tests. These are proposed improvements, not completed results.

If a run does not support the expected conclusion, explain its recorded outcome instead. Describe which next experiment would distinguish an incorrect assumption from environment noise; never hide the failure.

## 13. Finish — 20 seconds

**Say:**

> FaultNet demonstrates a complete testing sequence: establish normal behavior, inject a controlled fault, measure its effect, clear it, and check recovery. Saved application results, Wireshark packet observations and Packet Tracer routing simulations provide three clearly distinguished forms of evidence.

## Report and evidence checklist — 5 marks

The complete/correct report is a separate assessed deliverable. No final submission report is created by updating this script.

- Include project/student identifiers, problem statement, objectives and explanations of HTTP/TCP, proxies, timing, goodput, timeout and routing concepts.
- Include application architecture/request paths, listener roles, Packet Tracer topology/addressing/protocol configurations and the purpose of each tool.
- Document environment, payload, probe count, wait, timeout, fault values, independent variable, controlled settings, hypotheses and actual run/capture identifiers.
- Include measured phase tables/charts and matching screenshots; explain differences from baseline, packet timestamps/contents and routing-table changes. Keep application, capture and simulated-network results labelled separately.
- Include the what-if table, justified conclusions, unsuccessful/transient observations, limitations and proposed improvements. Do not present prior two-probe evidence as today's three-probe run.
- Include conclusions and references to tools/protocol documentation. Confirm required submission format with the course instructions; the supplied rubric does not specify a mandatory template or page count.

## Individual assessment rehearsal

Swap questions between presenters: explain the proxy request path; calculate 64/32 seconds; explain why a failed phase has no successful median; distinguish HTTP 503 from connection interruption; identify a faulty stream and its timing boundary; justify the timeout what-if; explain an alternate route and why current evidence cannot establish OSPF-versus-RIP speed. Each person should answer in their own words and connect the explanation to a visible observation.

## Short answers for questions

| Question | Answer |
| --- | --- |
| Why use a proxy? | It gives us a controlled place to delay, pace or interrupt test traffic while keeping dashboard controls responsive. |
| Is this testing the internet? | The core experiment uses real local HTTP/TCP traffic and a synthetic server on this laptop. The live proxy can target configured development applications. |
| Is this real packet-loss injection? | No. The current application simulates HTTP connection failures; packet loss requires separate packet-level evidence/injection. |
| Why median instead of only average? | The median is the middle observation and is less affected by a single unusually slow sample. |
| What does p95 mean? | A 95th-percentile summary of successful response times using nearest rank. Three samples give only a small descriptive summary. |
| Is Packet Tracer linked to the dashboard? | No. Its simulated reachability/routing results are separate from application measurements. |
| Where are results stored? | Experiment JSON files are in this laptop's results/ folder. Live monitor/configuration are memory-only; Git shares code/context, not generated records/captures. |
| Does static routing always fail after a link fault? | No. This specific lab intentionally lacks a backup static route. Other static configurations could have backup routes. |
| Does FaultNet repair the network? | It clears its injected fault and checks responses; Packet Tracer's dynamic routing demonstrates alternate-path selection separately. |
| Why two dashboards? | The workbench is for saved repeatable experiments; the live cockpit is for manual request configuration/monitoring. Both are FaultNet. |
| Did increasing timeout fix the delay? | It changes how long the client waits. Show whether completion improved in the measured pair; the configured delay remains. |
| Why are the timeout runs incompatible in Compare experiments? | That control requires matching measurement protocols. Different timeouts are intentionally compared outside it for the what-if analysis. |
| What supports the evaluation marks? | A controlled experiment, interpreted observations, justified decisions and explicit limitations/improvements; a larger feature list alone does not. |

## If something fails during presentation

- **Start is disabled:** Check Demo/Storage readiness, complete numeric inputs and the 120-second budget. Use the three-probe settings above. During an active experiment, wait or click Stop before another start.
- **Timing differs from the example:** Read actual values and settings. Background activity and overhead vary; do not claim exact milliseconds or replace failed observations.
- **Site is blocked:** Use a previously working browser or your prepared screenshot/export. Do not bypass a browser security warning. Label backup evidence as a prior run.
- **No Wireshark packets:** Check loopback interface, capture started before the run, and correct capture/display filter syntax. Use the prepared capture if necessary and disclose its date/settings.
- **Packet Tracer ping fails at startup:** Allow ARP/interfaces/routes to settle, repeat and retain transient failures. Verify the selected file/interface and restore the link afterward. Do not promise immediate failover.
- **Download does not complete:** Use the pre-downloaded matching JSON/CSV and identify its run ID. Do not spend the presentation debugging the download manager.

The rubric update is source/settings checked, not a fresh live rehearsal. Bounded workbench rendering and prior application/capture/routing evidence exist, but this complete presentation, its new timeout pair, fresh captures and lab reruns have not been executed for this revision. Both presenters must rehearse and fill the tables with actual observations; no score is guaranteed by the script.
