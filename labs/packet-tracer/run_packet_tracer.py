"""Build and check one FaultNet lab in an EMPTY, running Cisco Packet Tracer.

Uses the supplied MCP project's documented V5 file bridge and Script Engine
helpers. Keep Packet Tracer open with MCP BUILDER installed. No private token is
read by this script; the V5 file mailbox is scoped to the local Windows user.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
MCP = Path(os.environ.get("FAULTNET_PACKET_TRACER_MCP", Path.home() / "Downloads" / "MCP-Packet-Tracer-main"))
if not MCP.is_dir():
    raise SystemExit(f"Supplied MCP source not found at {MCP}")
sys.path.insert(0, str(MCP))

from src.packet_tracer_mcp.infrastructure.execution.file_bridge import FileBridge
from src.packet_tracer_mcp.domain.services.canvas import decode_pt_image


def stamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def ask(bridge: FileBridge, js: str, timeout: float = 30.0) -> str:
    guarded = "try{" + js + "}catch(__e){reportResult('PT_ERROR:'+__e);}"
    answer = bridge.send_and_wait(guarded, timeout=timeout)
    if answer is None:
        raise RuntimeError("Packet Tracer did not answer the V5 file bridge")
    if answer.startswith("PT_ERROR:"):
        raise RuntimeError(answer)
    return answer


def topology(bridge: FileBridge) -> dict:
    code = (
        "var n=ipc.network();var a=[];"
        "for(var i=0;i<n.getDeviceCount();i++){"
        "var d=n.getDeviceAt(i);var ps=[];"
        "for(var j=0;j<d.getPortCount();j++){"
        "var p=d.getPortAt(j);var ip='';var linked=false;"
        "try{ip=p.getIpAddress()||'';}catch(e){}"
        "try{linked=(p.getLink()!=null);}catch(e){}"
        "ps.push({name:p.getName(),ip:ip,linked:linked});}"
        "a.push({name:d.getName(),model:d.getModel(),ports:ps});}"
        "reportResult(JSON.stringify({devices:a,links:n.getLinkCount()}));"
    )
    return json.loads(ask(bridge, code))


def deploy(bridge: FileBridge, scenario: str, evidence: dict, output: Path) -> None:
    existing = topology(bridge)
    if existing["devices"] or existing["links"]:
        raise RuntimeError("Packet Tracer is not empty; open a new blank workspace before deploying")

    commands = (ROOT / scenario / "build.js").read_text(encoding="utf-8").splitlines()
    for start in range(0, len(commands), 12):
        batch = commands[start : start + 12]
        body = "var errs=[];" + "".join(
            "try{" + line + "}catch(e){errs.push(" + json.dumps(str(start + i + 1)) + "+':'+e);}"
            for i, line in enumerate(batch)
        ) + "reportResult(JSON.stringify(errs));"
        errors = json.loads(ask(bridge, body, timeout=90.0))
        if errors:
            raise RuntimeError(f"Build statements failed: {errors}")

    plan = json.loads((ROOT / scenario / "plan.json").read_text(encoding="utf-8"))
    expected = {d["name"] for d in plan["devices"]}
    expected_ips = {
        (d["name"], port): address.split("/")[0]
        for d in plan["devices"]
        for port, address in d["interfaces"].items()
    }
    expected_linked = {
        (link["device_a"], link["port_a"])
        for link in plan["links"]
    } | {
        (link["device_b"], link["port_b"])
        for link in plan["links"]
    }
    deadline = time.monotonic() + 30.0
    while True:
        actual = topology(bridge)
        names = {d["name"] for d in actual["devices"]}
        observed_ips = {
            (d["name"], p["name"]): p["ip"]
            for d in actual["devices"] for p in d["ports"]
        }
        observed_linked = {
            (d["name"], p["name"])
            for d in actual["devices"] for p in d["ports"] if p["linked"]
        }
        missing_ips = {
            f"{name}:{port}": ip for (name, port), ip in expected_ips.items()
            if observed_ips.get((name, port)) != ip
        }
        missing_links = expected_linked - observed_linked
        auxiliary_only = all(name.startswith("Power Distribution Device") for name in names - expected)
        if actual["links"] == 12 and expected <= names and auxiliary_only and not missing_ips and not missing_links:
            break
        if time.monotonic() >= deadline:
            raise RuntimeError(
                f"Live topology differs: {len(names)} devices, {actual['links']} links; "
                f"IP addresses pending: {missing_ips}; ports without links: {sorted(missing_links)}"
            )
        time.sleep(1.0)
    evidence["topology"] = actual

    filename = f"FaultNet-{scenario}.pkt"
    path = (output / filename).as_posix()
    result = ask(
        bridge,
        "var p=" + json.dumps(path) + ";"
        "ipc.appWindow().fileSaveAsNoPrompt(p,false);"
        "var fm=ipc.systemFileManager();"
        "reportResult(fm.fileExists(p)?String(fm.getFileSize(p)):'NOT_SAVED');",
        timeout=45.0,
    )
    if result == "NOT_SAVED" or int(result) < 1000 or not Path(path).is_file():
        raise RuntimeError(f"Packet Tracer did not save a valid-sized .pkt: {result}")
    evidence["pkt"] = {"path": path, "bytes": int(result)}

    raw = ask(
        bridge,
        "var w=ipc.appWindow().getActiveWorkspace().getLogicalWorkspace();"
        "reportResult(String(w.getWorkspaceImage('PNG')));",
        timeout=60.0,
    )
    png = decode_pt_image(raw, "PNG")
    screenshot = output / "topology.png"
    screenshot.write_bytes(png)
    evidence["screenshot"] = {"path": str(screenshot), "bytes": len(png)}


def console_ping(bridge: FileBridge, source: str, target: str) -> dict:
    source_js = json.dumps(source)
    target_js = json.dumps("ping " + target)
    arm = (
        "var d=ipc.network().getDevice(" + source_js + ");"
        "if(!d){reportResult('MISSING_SOURCE');}else{"
        "var c=d.getCommandLine();c.enterCommand('');"
        "var o=String(c.getOutput());"
        "var m=o.match(/Packets: Sent|Success rate/g);"
        "var base=m?m.length:0;c.enterCommand(" + target_js + ");"
        "reportResult('BASE:'+base);}"
    )
    marker = ask(bridge, arm)
    if not marker.startswith("BASE:"):
        raise RuntimeError(f"Could not start ping: {marker}")
    base = int(marker[5:])
    poll = (
        "var c=ipc.network().getDevice(" + source_js + ").getCommandLine();"
        "var o=String(c.getOutput());var m=o.match(/Packets: Sent|Success rate/g);"
        "var count=m?m.length:0;"
        "reportResult(count>" + str(base) + "?o:'WAIT');"
    )
    end = time.monotonic() + 30.0
    while time.monotonic() < end:
        output = ask(bridge, poll)
        if output != "WAIT":
            found = re.findall(r"Packets: Sent\s*=\s*(\d+),\s*Received\s*=\s*(\d+)", output)
            if found:
                sent, received = map(int, found[-1])
                return {"at": stamp(), "source": source, "target": target, "sent": sent, "received": received, "output": output[-1200:]}
            found = re.findall(r"Success rate is\s*(\d+)\s*percent\s*\((\d+)/(\d+)\)", output)
            if found:
                percent, received, sent = map(int, found[-1])
                return {"at": stamp(), "source": source, "target": target, "sent": sent, "received": received, "output": output[-1200:]}
            return {"at": stamp(), "source": source, "target": target, "sent": None, "received": None, "output": output[-1200:]}
        time.sleep(1.0)
    raise RuntimeError("Ping did not finish within 30 seconds")


def fault_link(bridge: FileBridge, enabled: bool) -> None:
    code = (
        "var d=ipc.network().getDevice('R1');"
        "var p=d.getPort('GigabitEthernet0/0');"
        "p.setPower(" + ("true" if enabled else "false") + ");"
        "reportResult('OK');"
    )
    if ask(bridge, code) != "OK":
        raise RuntimeError("Could not change the R1-R2 link")


def measure(bridge: FileBridge, scenario: str, evidence: dict) -> None:
    # ARP can consume the first ping, so use a second baseline ping to judge reachability.
    time.sleep(25 if scenario == "ospf" else 65 if scenario == "rip" else 5)
    evidence["baselineWarmup"] = console_ping(bridge, "PC1", "192.168.1.2")
    baseline = console_ping(bridge, "PC1", "192.168.1.2")
    evidence["baseline"] = baseline
    if not baseline["sent"] or baseline["received"] != baseline["sent"]:
        raise RuntimeError("Baseline PC1-to-PC3 ping did not fully succeed")

    try:
        fault_link(bridge, False)
        evidence["faultAppliedAt"] = stamp()
        time.sleep(40 if scenario == "ospf" else 150 if scenario == "rip" else 5)
        evidence["duringFault"] = console_ping(bridge, "PC1", "192.168.1.2")
    finally:
        fault_link(bridge, True)
        evidence["faultRestoredAt"] = stamp()

    time.sleep(40 if scenario == "ospf" else 150 if scenario == "rip" else 8)
    evidence["afterRestore"] = console_ping(bridge, "PC1", "192.168.1.2")
    evidence["expectation"] = (
        "static: direct route should fail during R1-R2 outage; connectivity returns after restoration"
        if scenario == "static" else
        "dynamic routing: traffic should reconverge via R3 during R1-R2 outage and remain reachable after restoration"
    )
    during = evidence["duringFault"]
    restored = evidence["afterRestore"]
    during_ok = bool(during["sent"]) and (
        during["received"] == 0 if scenario == "static"
        else during["received"] == during["sent"]
    )
    restored_ok = bool(restored["sent"]) and restored["received"] == restored["sent"]
    evidence["verdict"] = {"duringFaultExpected": during_ok, "restoredReachable": restored_ok}
    if not (during_ok and restored_ok):
        raise RuntimeError(f"Live reachability did not match the {scenario} lab expectation")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("scenario", choices=("static", "rip", "ospf"))
    parser.add_argument("action", choices=("check", "deploy", "measure"))
    parser.add_argument("--output-dir", type=Path, help="New run output directory; default is ignored results/<UTC timestamp>/<scenario>")
    args = parser.parse_args()
    output = (args.output_dir or ROOT / "results" / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") / args.scenario).resolve()
    output.mkdir(parents=True, exist_ok=True)
    bridge = FileBridge()
    if not bridge.pt_alive():
        raise SystemExit("Packet Tracer V5 file bridge is not active; no live action taken")
    evidence: dict = {"scenario": args.scenario, "action": args.action, "startedAt": stamp(), "packetTracerVersion": "9.0.1 observed on this laptop"}
    try:
        if args.action == "check":
            evidence["topology"] = topology(bridge)
        elif args.action == "deploy":
            deploy(bridge, args.scenario, evidence, output)
        elif args.action == "measure":
            measure(bridge, args.scenario, evidence)
        evidence["status"] = "completed"
    except Exception as exc:
        evidence["status"] = "failed"
        evidence["error"] = str(exc)
        raise
    finally:
        evidence["endedAt"] = stamp()
        path = output / f"{args.action}-evidence.json"
        path.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
        print(f"Evidence saved: {path}")


if __name__ == "__main__":
    main()
