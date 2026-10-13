# Independent Packet Tracer review

Reviewed 12–13 October 2026 (Asia/Kolkata), using Cisco Packet Tracer 9.0.1 on this laptop.

Source: `task/packet-tracer-labs`, commit `9f72386cf4a1ae30ccd50ba7c0a1a403b3178229`. The three original `.pkt` files were extracted into an ignored local review directory; their byte counts and SHA-256 hashes matched the committed manifests before testing. The teammate's branch/files were not changed or merged. Saved local review copies include test commands and restored links; they are not replacements for the originals.

## Checks

- All three `.pkt` files opened in the installed simulator without a file/version error.
- Plans have 12 network devices and 12 links: three routers, three switches, six PCs, and a router triangle providing an alternate path.
- Address checks passed: unique usable host addresses, matching /30 subnets for router-link endpoints, /24 LAN gateways, no repeated link endpoints, and interface addresses/masks matching IOS configuration files.
- Static next hops are directly connected neighbors with the correct destination LANs. RIPv2 uses `no auto-summary`; OSPF uses unique router IDs and area 0 network statements matching the interfaces.
- PC1 (`192.168.0.2`) pinged PC3 (`192.168.1.2`). The fault was an administrative shutdown of R1 `GigabitEthernet0/0`, applied via its Config tab. CLI messages and red link indicators confirmed it. Each tested link was restored afterward.

| Project | Baseline observations | Direct link disabled | Restoration observations |
| --- | --- | --- | --- |
| Static | 2/4 warm-up, then 4/4 | 0/4; host-unreachable/timeouts | 3/4 initially, then 4/4 |
| RIP | 3/4 warm-up, then 4/4 | 4/4; replies use TTL 125 instead of baseline 126 | 2/4 initially; after reopening the restored review copy, 3/4 warm-up then 4/4 |
| OSPF | 3/4 warm-up, then 4/4 | 4/4; replies use TTL 125 instead of baseline 126 | 4/4 |

During the fault, R1's live `show ip route` confirmed:

```text
RIP:  R 192.168.1.0/24 [120/2] via 10.0.0.9, GigabitEthernet0/1
OSPF: O 192.168.1.0/24 [110/3] via 10.0.0.9, GigabitEthernet0/1
```

The next hop is R3, demonstrating the alternate path. The static project intentionally has no backup route for this destination; its outage is the expected control case, not a configuration defect.

## Verdict and limits

No blocking defect found in the reviewed addressing, routing configuration, saved-file opening, or PC1-to-PC3 baseline/fault scenario. The static outage and dynamic failover match the intended demonstration. Preserve transient failed replies in the report.

Packet Tracer's Fast Forward Time was used to advance the simulator. These checks establish reachability and route selection, not a measured convergence duration or a speed comparison between RIP and OSPF. The teammate's earlier transient observations remain separately recorded on the lab branch.

Not checked: every PC pair, failures of other links/routers, exact convergence times, older Packet Tracer versions, all laptop environments, and a complete live rerun of the optional Python/MCP rebuilding helpers. This is a bounded lab review, not a claim that every scenario is validated.

Local simulator transcripts are under ignored `.codex/packet-tracer-review-9f72386/`. Reviewed summaries are shared here; raw test files/screenshots are not committed.
