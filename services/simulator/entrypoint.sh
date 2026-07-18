#!/usr/bin/env bash
# UbeROS simulator entrypoint.
# Starts a virtual framebuffer, waits for it to be ready, then launches Gazebo
# rendering into display :99. A GUI is required for success criterion S4, so
# --headless-rendering is intentionally NOT used (research assumption A-5).
set -euo pipefail

WORLD="${UBEROS_WORLD:-/simulation/worlds/uberos_default.sdf}"

# Start the virtual framebuffer with GLX so Gazebo can render offscreen.
Xvfb :99 -screen 0 1920x1080x24 +extension GLX -ac >/tmp/xvfb.log 2>&1 &

# Wait for the X server to accept connections before launching Gazebo.
for _ in $(seq 1 30); do
  if xdpyinfo -display :99 >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

exec gz sim --verbose 1 "${WORLD}"
