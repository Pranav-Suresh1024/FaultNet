# FaultNet Wireshark guide

Use Wireshark to observe the real local HTTP experiment. Packet Tracer simulates a separate network; its virtual packets are not this capture.

## Environment and prerequisites

On the current laptop, TShark reports Wireshark 4.6.9 and dumpcap lists `Adapter for loopback traffic capture` (`\Device\NPF_Loopback`). This verifies installation/interface discovery, not permission to capture. An attempted five-second agent capture was rejected by automatic approval review as `blocked by policy`; no capture result is claimed.

Open the dashboard at http://127.0.0.1:3000/. If it is unavailable, an agent should run the repository's `npm start` command. Wait for Demo and Storage to report ready.

## Capture one experiment

1. Open Wireshark. Select **Adapter for loopback traffic capture**. Windows localhost traffic uses the Npcap loopback interface, not the Wi-Fi interface ([official setup](https://wiki.wireshark.org/CaptureSetup/Loopback)).
2. Before starting, enter this **capture filter** in the capture options:

   ```text
   host 127.0.0.1 and (tcp port 3001 or tcp port 3002)
   ```

   Port 3002 is probe-to-proxy traffic; port 3001 is proxy-to-demo traffic. Excluding control port 3000 keeps dashboard session capabilities out of this capture. Capture filters and display filters use different syntax ([official guide](https://www.wireshark.org/docs/wsug_html_chunked/ChCapCaptureFilterSection)).
3. Start capturing with the blue shark-fin button. In the dashboard, use the settings below and click Start experiment. Capture from before start until the run completes, including recovery.
4. Click Wireshark's red Stop button. Save as a `.pcapng` in a local evidence folder under ignored `results/wireshark/`. Use one file per experiment; do not commit raw captures.
5. Download the matching dashboard JSON/CSV. Record the run ID, settings, UTC phase times, capture filename, interface, filter, and actual observations. Failed attempts and missing data remain part of the evidence.

Common settings: **5 probes per phase**, **250 ms wait**, **5000 ms timeout**. Use identical settings for the comparison runs.

| Capture | Dashboard mode and fault | What to inspect; expectations are not measured results |
| --- | --- | --- |
| Baseline | Baseline only | GET `/payload` and complete 65,536-byte bodies without an injected fault. |
| Delay | Baseline → fault → recovery; Response delay = 500 ms | Faulty requests on port 3002 wait longer before the response; after clearance, timings should return toward baseline. |
| Bandwidth | Baseline → fault → recovery; Bandwidth restriction = 32 KiB/s | Response body delivery on port 3002 is spread over roughly two seconds; port 3001 is not throttled by this proxy. |
| Interruption | Baseline → fault → recovery; Connection interruption | Faulty port-3002 requests fail without complete responses; the proxy does not forward them to port 3001. Look at actual closure/reset flags rather than assuming every closure is a TCP reset. |

## Inspect packets

In the **display-filter** bar, use:

```text
tcp.port == 3002
```

Select a request packet, then **Analyze → Follow → TCP Stream** to isolate its connection ([official instructions](https://www.wireshark.org/docs/wsug_html_chunked/ChAdvFollowStreamSection.html)). This view should show the synthetic HTTP exchange. If HTTP is not recognized on this port, use **Analyze → Decode As → HTTP** for TCP port 3002. Use the JSON phase timestamps to identify baseline, faulty, and recovery connections; each probe opens a new connection.

Compare request-to-first-response timing for the delay and request-to-final-body timing for throttling. The latter is closer to FaultNet's full-response elapsed time, but capture timestamps and application timers can differ. TCP ACK timing alone does not measure the injected 500 ms application delay.

Optional display filters:

```text
tcp.port == 3002 and tcp.flags.reset == 1
tcp.port == 3002 and tcp.analysis.retransmission
```

Zero matches is a valid observation. HTTP failure is not proof of IP packet loss. Loopback checksums/offload and segment aggregation can affect what the capture displays; report what you observed without treating warnings or packet counts as payload-loss measurements.

If no packets appear, confirm the loopback interface, correct filter type, active experiment, and Start capture. If Windows reports a permission error, have the user handle the permission prompt or administrator launch; do not change security settings automatically.

## Evidence still required

The four captures and their analysis have not yet been performed. Interface discovery does not complete roadmap R18. Keep raw files local; transfer them separately only after deliberate review/authorization.
