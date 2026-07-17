<script>
  import { onMount } from 'svelte';
  import { GoldenLayout } from 'golden-layout';
  import 'golden-layout/dist/css/goldenlayout-base.css';
  import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';
  import {
    buildSimulatorPanel,
    buildTerminalPanel,
    buildEditorPanel,
    buildRosStatusPanel,
    defaultLayout,
  } from './lib/panels.js';

  const LAYOUT_KEY = 'uberos.layout.v1';

  // BroadcastChannel keeps pop-out windows and the main canvas in sync.
  // Closing a pop-out sends browser state only; it never stops a workload (S5).
  const channel =
    typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('uberos-panels')
      : null;

  let container;

  const factories = {
    simulator: buildSimulatorPanel,
    terminal: buildTerminalPanel,
    editor: buildEditorPanel,
    'ros-status': buildRosStatusPanel,
  };

  function loadSavedLayout() {
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveLayout(layout) {
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout.saveLayout()));
    } catch {
      /* localStorage may be unavailable; ignore for Init */
    }
  }

  onMount(() => {
    const layout = new GoldenLayout(container);

    for (const [type, build] of Object.entries(factories)) {
      layout.registerComponentFactoryFunction(type, (componentContainer) => {
        build(componentContainer.element);
      });
    }

    const saved = loadSavedLayout();
    layout.loadLayout(saved ?? defaultLayout);

    // Persist layout changes so a refresh restores the canvas (spec §9).
    layout.on('stateChanged', () => saveLayout(layout));

    // Notify other windows when a panel pops out (multi-screen use, J3).
    layout.on('itemCreated', (item) => {
      channel?.postMessage({ type: 'panel-created', panel: item.target?.type });
    });

    const onResize = () => layout.updateSize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      channel?.close();
      layout.destroy();
    };
  });
</script>

<div class="uberos-shell">
  <header class="uberos-titlebar">
    <span class="brand">UberOS</span>
    <span class="tagline">ROS in your browser</span>
  </header>
  <div class="uberos-canvas" bind:this={container}></div>
</div>

<style>
  .uberos-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .uberos-titlebar {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    padding: 0.4rem 0.9rem;
    background: var(--uberos-panel);
    border-bottom: 1px solid #313244;
  }

  .brand {
    font-weight: 700;
    color: var(--uberos-accent);
    letter-spacing: 0.03em;
  }

  .tagline {
    color: var(--uberos-muted);
    font-size: 0.8rem;
  }

  .uberos-canvas {
    position: relative;
    flex: 1;
    min-height: 0;
  }
</style>
