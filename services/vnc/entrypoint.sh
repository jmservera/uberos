#!/usr/bin/env bash
# UberOS VNC sidecar entrypoint.
# Runs in the simulator's network namespace and attaches to its X display :99.
# x11vnc exports the display on :5900; websockify serves noVNC and bridges the
# browser WebSocket to VNC on :6080 (reached via the proxy at /novnc/).
set -euo pipefail

DISPLAY_NUM="${DISPLAY:-:99}"

# Wait for the simulator's X server to become available in the shared namespace.
for _ in $(seq 1 60); do
  if x11vnc -display "${DISPLAY_NUM}" -query ping >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

# Export display :99 over VNC on localhost:5900 (no password: gated at the proxy).
x11vnc \
  -display "${DISPLAY_NUM}" \
  -nopw \
  -listen localhost \
  -xkb \
  -ncache 10 \
  -rfbport 5900 \
  -forever \
  -shared \
  -bg

# Serve noVNC static assets and bridge WebSocket -> VNC on :6080.
exec websockify \
  --web /usr/share/novnc/ \
  --heartbeat 30 \
  6080 \
  localhost:5900
