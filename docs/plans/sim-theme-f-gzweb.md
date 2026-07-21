# Theme F — Gazebo native web visualization (gzweb)

> Plan stub. Source of truth: [Simulation & Visualization PRD](../prds/uberos-simulation-visualization.md) §7.6. Highest risk (R-1). Spike: `.copilot-tracking/research/2026-07-21/gzweb-web-visualization-feasibility-research.md`.

## Scope — FR-F1 … FR-F5
- FR-F1 — Gazebo container runs headless `gz sim -s` + a WebSocket server (Ionic: `gz-launch` `WebsocketServer` plugin; Jetty: `gz-sim` `WebsocketServer` system). No Xvfb/VNC, no server GL context.
- FR-F2 — Self-hosted **minimal** `gzweb` client (static, config-injected WS URL) + websocket behind the proxy (`/gzweb/` static + `/gzweb/ws/` → `:9002`).
- FR-F3 — Gazebo panel loads the gzweb client; docks/pops-out/collapses like other panels.
- FR-F4 — Remove the VNC path for Gazebo (retire the old `simulator` + `vnc` sidecar Gazebo pipeline); VNC retained only for Turtlesim.
- FR-F5 — Interaction lag < 300ms; scene-state streamed (not pixels), compute server-side.

## Dependency / lane
- **Lane 2 (Gazebo backend) — start immediately, highest risk.** Rendering pipeline independent of A/B; launch wiring needs Theme B. Coordinate with **Theme E** (shared Gazebo container).

## Decisions locked (from spike)
- Client: minimal page on `gazebo-web/gzweb` (not `gazebosim-app`). Camera-sensor image topics out of scope. Pairing stays kilted/ionic.

## Likely files
- `services/gazebo/` (reshape `services/simulator`): headless `gz sim -s`, `.gzlaunch` with `WebsocketServer`
- self-hosted gzweb static client (new)
- `services/proxy/nginx.conf` (`/gzweb/` + `/gzweb/ws/`)
- `compose.yaml` (gazebo service; retire vnc-for-gazebo)

## Tasks
- [ ] Research: confirm `gz-launch-websocket-server` in the base image; build minimal gzweb client bundle w/ configurable WS URL
- [ ] Plan: gazebo service reshape + proxy routes + client bundle
- [ ] Implement: headless server + WebsocketServer + client + routes; retire Gazebo VNC
- [ ] Tests: gzweb panel renders; no x11vnc dep; measure lag < 300ms
- [ ] Acceptance (PRD §7.6)
