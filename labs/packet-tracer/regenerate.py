"""Generate reproducible FaultNet Packet Tracer plans from the supplied MCP source.

This program performs offline planning only. It never asserts a live PT result.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent
MCP = Path(os.environ.get("FAULTNET_PACKET_TRACER_MCP", Path.home() / "Downloads" / "MCP-Packet-Tracer-main"))
OUT = Path(os.environ.get("FAULTNET_PACKET_TRACER_OUTPUT", HERE / "results" / "generated"))
if not MCP.is_dir():
    raise SystemExit("Set FAULTNET_PACKET_TRACER_MCP to the supplied MCP source checkout")
sys.path.insert(0, str(MCP))

from src.packet_tracer_mcp.domain.models.requests import TopologyRequest
from src.packet_tracer_mcp.domain.services.orchestrator import plan_from_request
from src.packet_tracer_mcp.domain.services.validator import validate_plan
from src.packet_tracer_mcp.infrastructure.generator.ptbuilder_generator import (
    generate_executable_script,
)
from src.packet_tracer_mcp.infrastructure.generator.cli_config_generator import (
    generate_all_configs,
)
from src.packet_tracer_mcp.shared.enums import RoutingProtocol, TopologyTemplate


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for protocol in ("static", "rip", "ospf"):
        req = TopologyRequest(
            template=TopologyTemplate.THREE_ROUTER_TRIANGLE,
            routers=3,
            switches_per_router=1,
            pcs_per_lan=2,
            dhcp=False,
            routing=RoutingProtocol(protocol),
            router_model="2911",
            switch_model="2960-24TT",
        )
        plan, validation = plan_from_request(req)
        # Keep labels inside the canvas and separate the third router's
        # alternate link from the direct R1-R2 link in topology previews.
        for device in plan.devices:
            device.x += 80
            if device.name == "R3":
                device.y = 40
        if protocol == "rip":
            # IOS RIP `network` matches a classful major network. Listing /30
            # subnet starts separately can be rejected by IOS and needlessly
            # obscures the intended all-10/8 interface enablement.
            for rip in plan.rip_configs:
                lan = [net for net in rip.networks if not net.startswith("10.")]
                rip.networks = ["10.0.0.0", *lan]
            validation = validate_plan(plan)
        if not validation.is_valid:
            raise RuntimeError(f"{protocol}: {validation.to_dict()}")
        assert len(plan.devices) == 12
        assert len(plan.links) == 12
        assert len(plan.devices_by_category("router")) == 3
        assert len(plan.devices_by_category("pc")) == 6
        assert {r.name for r in plan.devices_by_category("router")} == {"R1", "R2", "R3"}
        assert any(l.device_a == "R1" and l.device_b == "R2" for l in plan.links)
        assert any(l.device_a == "R2" and l.device_b == "R3" for l in plan.links)
        assert any(l.device_a == "R3" and l.device_b == "R1" for l in plan.links)
        assert plan.device_by_name("PC1").interfaces["FastEthernet0"] == "192.168.0.2/24"
        assert plan.device_by_name("PC3").interfaces["FastEthernet0"] == "192.168.1.2/24"
        assert plan.device_by_name("PC5").interfaces["FastEthernet0"] == "192.168.2.2/24"

        scenario = OUT / protocol
        scenario.mkdir(exist_ok=True)
        plan.name = f"faultnet-{protocol}-triangle"
        (scenario / "plan.json").write_text(plan.model_dump_json(indent=2) + "\n", encoding="utf-8")
        (scenario / "build.js").write_text(generate_executable_script(plan) + "\n", encoding="utf-8")
        configs = generate_all_configs(plan)
        for name in ("R1", "R2", "R3", "SW1", "SW2", "SW3"):
            (scenario / f"{name}.ios.txt").write_text(configs[name] + "\n", encoding="utf-8")
        metadata = {
            "protocol": protocol,
            "validation": validation.to_dict(),
            "deviceCount": len(plan.devices),
            "linkCount": len(plan.links),
            "pcSource": "PC1 192.168.0.2/24",
            "pcTarget": "PC3 192.168.1.2/24",
            "faultLink": "R1 GigabitEthernet0/0 <-> R2 GigabitEthernet0/0",
            "evidenceStatus": "offline plan validated; live PT not yet observed",
        }
        (scenario / "manifest.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
        print(protocol, json.dumps({"devices": len(plan.devices), "links": len(plan.links), "valid": validation.is_valid}))


if __name__ == "__main__":
    main()
