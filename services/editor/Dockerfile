# UberOS code editor container (code-server).
# Serves a browser VS Code experience bound to the shared ROS workspace so
# edits are immediately visible to the ROS build toolchain (F-15, S6). See WP-7.
FROM codercom/code-server:latest

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Ensure the shared workspace mount point exists and is owned by the coder user.
RUN mkdir -p /ros_ws/src && chown -R coder:coder /ros_ws

USER coder
EXPOSE 8443
