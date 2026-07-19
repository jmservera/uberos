# Project Context

- **Owner:** jmservera
- **Project:** Browser-accessible ROS and simulator environment on Docker Compose
- **Stack:** ROS, Gazebo, Docker Compose, noVNC, browser-based VS Code, web terminals, Nginx or Traefik, web frontend
- **Created:** 2026-07-17T09:22:05.804+02:00

## Learnings

- The workspace must manage multiple GUI, editor, and terminal windows inside a browser canvas.
- noVNC sessions must also open independently in separate browser windows for multi-display workflows.
- **Golden Layout v2 sub-window body wipe (2026-07-19):** A blank GL pop-out
  (`/?gl-window=...`) is caused by the *indeterminate* constructor path. When
  `new GoldenLayout(container)` is built WITHOUT a `bindComponentEventHandler`, GL v2
  treats init as indeterminate; in a sub-window it calls
  `clearHtmlAndAdjustStylesForSubWindow()` → `document.body.innerHTML = ''`, which
  destroys any framework-managed (Svelte) container element before `super.init()`
  runs. Fix: use the **determinate constructor** — pass
  `bindComponentEventHandler` (+ `unbindComponentEventHandler`). This sets
  `_bindComponentEventHanlderPassedInConstructor = true`, makes init synchronous, and
  SKIPS the body wipe. `window.__glInstance` is still set in the sub-window, so
  dock-back / `popInOnClose` keep working. The `isSubWindow` guard on `loadLayout`
  alone is necessary but NOT sufficient — the body wipe is the real culprit.
- **GL sub-window chrome & title (2026-07-19):** With the *determinate* constructor
  the framework DOM is preserved (no `document.body` wipe), so a global CSS hide rule
  competes with App.svelte's scoped `.uberos-titlebar { display:flex }` and the
  titlebar leaks into pop-outs. Robust fix: hide non-panel chrome via **conditional
  render** (`{#if !isSubWindow}` around the header, flag from `?gl-window`) instead of
  CSS. Also set `document.title` from `layout.rootItem?.title` (with a
  `forEachComponent` fallback) in the sub-window branch so the pop-out window/tab
  reads the panel name rather than the static app title.
