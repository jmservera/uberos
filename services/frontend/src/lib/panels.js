import ROSLIB from 'roslib';
import { onRosStatus, startRos } from './ros.js';

// Panel content builders for the Golden Layout window manager.
// Each builder receives the panel's root HTML element and populates it.
// The simulator, terminal, and editor panels are iframes routed through the
// single proxy origin (I-05, I-12). The ROS status panel uses the shared
// rosbridge connection.

function makeIframe(src) {
  const frame = document.createElement('iframe');
  frame.className = 'panel-frame';
  frame.src = src;
  // No sandbox attribute: same-origin routing keeps code-server and noVNC
  // working (research RISK-8). allow clipboard for editor/terminal ergonomics.
  frame.setAttribute('allow', 'clipboard-read; clipboard-write');
  return frame;
}

export function buildSimulatorPanel(el) {
  // noVNC served under /novnc/, bridging to websockify.
  el.appendChild(
    makeIframe('/novnc/vnc.html?autoconnect=true&resize=scale&path=novnc/websockify')
  );
}

export function buildTerminalPanel(el) {
  el.appendChild(makeIframe('/terminal/'));
}

export function buildEditorPanel(el) {
  el.appendChild(makeIframe('/editor/'));
}

export function buildRosStatusPanel(el) {
  const body = document.createElement('div');
  body.className = 'panel-body';

  const header = document.createElement('div');
  header.innerHTML =
    '<span class="status-dot warn"></span><strong>ROS bridge</strong>: <span id="ros-state">connecting…</span>';

  const nodesTitle = document.createElement('p');
  nodesTitle.innerHTML = '<strong>Nodes</strong>';
  const nodesList = document.createElement('pre');
  nodesList.className = 'log-line';
  nodesList.textContent = '(waiting for connection)';

  const logTitle = document.createElement('p');
  logTitle.innerHTML = '<strong>/rosout</strong> (last lines)';
  const logView = document.createElement('div');

  body.append(header, nodesTitle, nodesList, logTitle, logView);
  el.appendChild(body);

  startRos();

  const dot = header.querySelector('.status-dot');
  const stateText = header.querySelector('#ros-state');
  const logLines = [];

  onRosStatus(({ status, ros }) => {
    stateText.textContent = status;
    dot.className = 'status-dot ' + (status === 'connected' ? 'ok' : status === 'error' || status === 'closed' ? 'err' : 'warn');

    if (status === 'connected' && ros) {
      ros.getNodes(
        (nodes) => {
          nodesList.textContent = nodes.length ? nodes.join('\n') : '(none)';
        },
        () => {
          nodesList.textContent = '(node query failed)';
        }
      );

      const rosout = new ROSLIB.Topic({
        ros,
        name: '/rosout',
        messageType: 'rcl_interfaces/msg/Log',
      });
      rosout.subscribe((msg) => {
        logLines.push(`[${msg.name || '?'}] ${msg.msg || ''}`);
        while (logLines.length > 20) logLines.shift();
        logView.innerHTML = logLines
          .map((l) => `<p class="log-line">${escapeHtml(l)}</p>`)
          .join('');
      });
    }
  });
}

// Small helpers -----------------------------------------------------------

function escapeHtml(s) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}

// Default first-launch layout: four panels (F-16).
export const defaultLayout = {
  root: {
    type: 'row',
    content: [
      {
        type: 'column',
        width: 60,
        content: [
          { type: 'component', componentType: 'simulator', title: 'Simulator' },
          { type: 'component', componentType: 'terminal', title: 'Terminal' },
        ],
      },
      {
        type: 'column',
        width: 40,
        content: [
          { type: 'component', componentType: 'editor', title: 'Code Editor' },
          { type: 'component', componentType: 'ros-status', title: 'ROS Status' },
        ],
      },
    ],
  },
};
