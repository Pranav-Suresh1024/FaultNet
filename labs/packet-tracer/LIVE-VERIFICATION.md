# Live Packet Tracer verification

Tested 12 October 2026 in Cisco Packet Tracer 9.0.1 using the supplied Packet Tracer MCP. The bridge reported connected through its file transport. All three plans passed validation with zero errors and warnings; each live deployment reported 12/12 planned devices and 12/12 links verified. Each saved .pkt was reopened, reporting 13 total live objects (the 12 network devices plus Packet Tracer's auxiliary Power Distribution Device0) and 12 links.

PC1 (192.168.0.2) pinged PC3 (192.168.1.2) four times per test. The direct R1 GigabitEthernet0/0 to R2 GigabitEthernet0/0 link was shut down on R1 and then restored before each final save.

| Routing | Stable baseline | Link down | After link restored | Live routing evidence while down |
| --- | --- | --- | --- | --- |
| Static | 4/4 | 0/4 | 4/4 | No alternate route; observed outage. |
| RIPv2 | 4/4 | 4/4 | 4/4 | R1: R 192.168.1.0/24 [120/2] via 10.0.0.9, GigabitEthernet0/1. |
| OSPF area 0 | 4/4 | 3/4 then 4/4 | 4/4 | R1: O 192.168.1.0/24 [110/3] via 10.0.0.9, GigabitEthernet0/1. |

Fresh builds needed time for ARP and routing convergence. The initial static baseline was 2/4 before reaching 4/4; its first restoration ping was 3/4 before 4/4. RIP initially returned 0/4, then 3/4, then 4/4 as it converged. OSPF initially returned 0/4 twice, then 3/4, then 4/4. The OSPF fault's first ping lost one packet during failover, followed by 4/4. These transient results are retained in each scenario's measure-evidence.json rather than being hidden.

The projects were saved after restoring the interface, so they open in a healthy baseline state. To reproduce the fault, shut R1 GigabitEthernet0/0 again. These results are Packet Tracer simulated-IP observations; the FaultNet Node dashboard records separate synthetic HTTP experiment data.
