# UberOS noVNC + VNC sidecar.
# Shares the simulator's network namespace (compose network_mode: service:simulator)
# so x11vnc can attach to display :99 and websockify can serve noVNC to the
# proxy at :6080, without publishing VNC to any network. See WP-4.
FROM ubuntu:24.04

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        x11vnc \
        novnc \
        websockify \
        openbox \
        curl \
        procps \
    && rm -rf /var/lib/apt/lists/*

COPY openbox-rc.xml /etc/openbox-rc.xml
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5900 6080

ENTRYPOINT ["/entrypoint.sh"]
