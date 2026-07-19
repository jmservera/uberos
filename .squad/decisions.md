# Squad Decisions

## Active Decisions

### 2026-07-17: UbeROS Init architecture and stack

**By:** copilot (RPI Agent)
**Scope:** UbeROS Init milestone — full Docker Compose scaffold and first-pass services

Initial implementation of the UbeROS Init milestone landed the full Docker
Compose scaffold and first-pass service implementations. Key decisions (recorded
as ADRs under `docs/decisions/`):

- ADR-001 ROS distribution: **Lyrical** (`ROS_DISTRO=lyrical`, `GZ_RELEASE=jetty`).
  SPIKE-A passed on 2026-07-17 — `ros:lyrical-ros-base`, `rosbridge-suite` 4.2.0,
  `rosapi`, `ros-gz` 3.0.9, and the Jetty image all verified. Jazzy/Harmonic
  remain a one-line `.env` fallback.
- ADR-002 Reverse proxy: **Nginx** (single ingress, WebSocket, auth_basic).
- ADR-003 Terminal transport: **ttyd inside the ros container** (no Docker socket).
- ADR-004 Frontend: **Svelte + Golden Layout v2**; browsers Chrome/Edge only.
- ADR-005 Auth: **Nginx auth_basic** for Init (off on localhost), OAuth2-Proxy
  upgrade path; single-user Init must not preclude future multi-user.

**Why:** Establishes the baseline architecture. Scope: localhost-only S1-S6
acceptance; streaming perf (N-08) deferred.

### 2026-07-19: Native Golden Layout pop-out fixed via determinate constructor

**By:** Switch (Frontend Engineer), requested by jmservera
**Scope:** Theme A native pop-out (FR-A1..A6), PR #6, branch `squad/theme-a-native-popout`
**File:** `services/frontend/src/App.svelte` (`onMount`)

**Root cause:** Popped-out child windows (`/?gl-window=...`) rendered BLANK. The app
built `new GoldenLayout(container)` with NO `bindComponentEventHandler`, so GL v2.6
treated the constructor as *indeterminate*. In a sub-window, `VirtualLayout.init()`
then took the indeterminate path: deferred 7ms, then called
`clearHtmlAndAdjustStylesForSubWindow()` which runs `document.body.innerHTML = ''`.
That wiped the Svelte-rendered DOM — including the `bind:this={container}` element —
so `super.init()` built the ground item inside a now-detached container → nothing in
the child `<body>`. The `isSubWindow` guard on `loadLayout` was necessary but not
sufficient; the body wipe was the real culprit.

**Decision / fix:** Use the GL v2 *determinate constructor* pattern — pass a
`bindComponentEventHandler` (and `unbindComponentEventHandler`) to the
`GoldenLayout` constructor. This sets `_bindComponentEventHanlderPassedInConstructor
= true`, which makes init run synchronously and SKIPS the body wipe, preserving the
Svelte-managed DOM. The bind handler dispatches to the existing `factories` map to
build panels; the old `registerComponentFactoryFunction` loop was removed. GL still
sets `window.__glInstance = this` in the sub-window, so parent dock-back /
`popInOnClose` keeps working. Sub-window "suitability" (hiding chrome) remains handled
by the `body.uberos-subwindow` class + CSS. `withNativePopout` (popInOnClose +
header.popout) and the `isSub` guard on `loadLayout` are unchanged.

**Validation:** `npm run build` (vite v5.4.21) passes — 125 modules transformed,
built in 36s. No custom pop-out button code reintroduced (native pop-out only, FR-A6).

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
