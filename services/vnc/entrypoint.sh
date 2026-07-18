#!/usr/bin/env bash
# UbeROS VNC sidecar entrypoint.
# Runs in the simulator's network namespace and attaches to its X display :99.
# x11vnc exports the display on :5900; websockify serves noVNC and bridges the
# browser WebSocket to VNC on :6080 (reached via the proxy at /novnc/).
set -euo pipefail

DISPLAY_NUM="${DISPLAY:-:99}"

# Wait for the simulator's X server socket (shared via the x11-socket volume)
# to appear before attaching x11vnc to display :99.
X11_SOCKET="/tmp/.X11-unix/X${DISPLAY_NUM#:}"
for _ in $(seq 1 120); do
  if [ -S "${X11_SOCKET}" ]; then
    break
  fi
  sleep 0.5
done

# Run a lightweight window manager on the simulator's display. Without a WM the
# Gazebo Qt window is never mapped/sized properly and noVNC shows a black
# desktop with stray window fragments. Openbox maximizes and undecorates it so
# the simulator fills the framebuffer (S4). Xvfb runs with -ac, so this sidecar
# can manage :99 across the container boundary via the shared X socket.
DISPLAY="${DISPLAY_NUM}" openbox --config-file /etc/openbox-rc.xml &

# Export display :99 over VNC on localhost:5900 (no password: gated at the proxy).
# -noshm: the sidecar has a separate IPC namespace from the simulator, so the
# MIT-SHM extension cannot attach; read pixels over the X protocol instead.
# No -ncache: client-side caching enlarges the framebuffer well beyond the real
# screen, which noVNC renders as a small strip on a large black canvas.
x11vnc \
  -display "${DISPLAY_NUM}" \
  -nopw \
  -listen localhost \
  -noshm \
  -xkb \
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
