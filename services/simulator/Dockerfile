# UbeROS Gazebo simulator container.
# Runs Gazebo headlessly against a virtual framebuffer (Xvfb :99) with software
# rendering by default. The vnc sidecar streams display :99 to the browser.
# See WP-3 in docs/specs/01-Init-research.md.
#
# GZ_RELEASE is parameterized (default jetty). If SPIKE-A shows the Jetty image
# is unavailable, switch GZ_RELEASE=harmonic in .env with no other edits.
ARG GZ_RELEASE=jetty
FROM ghcr.io/openrobotics/gazebo:${GZ_RELEASE}-full

# Virtual framebuffer, VNC-adjacent tooling, and Mesa software GL stack.
# procps provides pgrep for the health check.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        xvfb \
        x11-utils \
        mesa-utils \
        libgl1-mesa-dri \
        libosmesa6 \
        libglu1-mesa \
        procps \
    && rm -rf /var/lib/apt/lists/*

# Disable automatic Fuel downloads for Init; the world uses built-in primitives.
COPY config/fuel.yaml /root/.gz/fuel/config.yaml

ENV DISPLAY=:99
ENV LIBGL_ALWAYS_SOFTWARE=1
ENV MESA_GL_VERSION_OVERRIDE=3.3
ENV MESA_GLSL_VERSION_OVERRIDE=330
ENV GZ_SIM_RESOURCE_PATH=/simulation/models:/simulation/worlds

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# noVNC/websockify (served by the vnc sidecar in the shared namespace) reaches
# the browser through the proxy; nothing here is host-published.
EXPOSE 5900 6080

ENTRYPOINT ["/entrypoint.sh"]
