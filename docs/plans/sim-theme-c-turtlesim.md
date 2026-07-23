# Theme C — Turtlesim visualizer

> Plan stub. Source of truth: [Simulation & Visualization PRD](../prds/uberos-simulation-visualization.md) §7.3.

## Scope — FR-C1 … FR-C4
- FR-C1 — `turtlesim` service: Xvfb + `turtlesim_node` + window manager + x11vnc + websockify (reuse the existing VNC pattern), rendered via noVNC.
- FR-C2 — Turtlesim noVNC reachable behind the proxy at its own route (e.g. `/sim/turtlesim/novnc/`); no host-published port.
- FR-C3 — `turtlesim_node` joins the ROS graph natively (no bridge) via the discovery server.
- FR-C4 — Drivable from a Terminal panel (teleop) while visible.

## Dependency / lane
- **Lane 3 (Turtlesim backend) — parallel, starts immediately.** Service/route infra independent of A/B.
- Menu wiring depends on Theme A (registry entry) + Theme B (launch). Build inclusion via Theme D.

## Likely files
- `services/turtlesim/` (new Dockerfile + entrypoint, modeled on `services/vnc/`)
- `compose.yaml` (new service, `simulators` profile)
- `services/proxy/nginx.conf` (new noVNC route)

## Tasks
- [ ] Research: reuse of vnc sidecar pattern; turtlesim package name for ROS_DISTRO
- [ ] Plan: service layout + proxy route
- [ ] Implement: turtlesim service + route + ROS domain join
- [ ] Tests: turtle renders; `/turtle1/cmd_vel` moves it
- [ ] Acceptance (PRD §7.3)
