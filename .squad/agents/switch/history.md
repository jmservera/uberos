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
