# Right Side Tabs - VNC Viewer (Design + Implementation)

This document describes how the RightSideTabs UI surfaces the VNC Viewer and how multiple VNC hosts are configured, parsed, and rendered.

## Overview

The RightSideTabs layout includes a VNC Viewer tab that is always visible for any selected profile type. The VNC Viewer supports multiple hosts by reading a comma-separated list of VNC server URLs from server settings, then rendering one VNC tile per host. Each tile owns its own noVNC session, connection state, and controls.

## User Experience

- The **VNC Viewer** tab appears alongside Team, To-Do, and Terminal tabs.
- When opened, the viewer loads server settings and lists all configured VNC hosts.
- Each host is shown as its own tile with:
  - Connection status (indicator + text)
  - Connect / Disconnect controls
  - View-only vs interactive toggle
  - Maximize / restore control (Esc exits full screen)
- If no hosts are configured, the panel shows an instructional empty state.

## Configuration Sources

The VNC Viewer resolves hosts and credentials in this order:

1. **Multiple hosts:** `AUTOBYTEUS_VNC_SERVER_URLS` (comma-separated).
2. **Single host fallback:** `AUTOBYTEUS_VNC_SERVER_URL`.
3. **Password:**
   - `AUTOBYTEUS_VNC_SERVER_PASSWORD`, then
   - `AUTOBYTEUS_VNC_PASSWORD`, then
   - `runtimeConfig.public.vncPassword`, then
   - fallback to `mysecretpassword`.

Settings are loaded via `useServerSettingsStore.fetchServerSettings()` and cached in the Pinia store.

## Multi-Host Parsing & Normalization

`parseCommaSeparatedHosts()` converts a comma-separated list into `VncHostConfig` objects:

- Trims whitespace and ignores empty entries.
- Assigns a deterministic id (`vnc-0`, `vnc-1`, ...).
- Uses the raw entry as the display name.
- Normalizes URLs to WebSocket form:
  - `host:5900` becomes `ws://host:5900`.
  - Existing `ws://` or `wss://` prefixes are preserved.

This ensures noVNC is always handed a WebSocket URL.

## Component Responsibilities

**RightSideTabs** (`components/layout/RightSideTabs.vue`)
- Always includes the VNC Viewer tab (`requires: 'any'`).
- Manages the active tab based on the selected profile type.

**VncViewer** (`components/workspace/tools/VncViewer.vue`)
- Fetches server settings on mount if they are missing.
- Computes the host list and a single password shared across hosts.
- Renders one `VncHostTile` per host with `auto-connect` enabled.

**VncHostTile** (`components/workspace/tools/VncHostTile.vue`)
- Owns the connection UI and embeds a noVNC canvas in a sized container.
- Auto-connects once the container has non-zero size.
- Uses `ResizeObserver` to refresh the viewport and to retry deferred auto-connect.
- Supports:
  - manual connect/disconnect
  - view-only vs interactive toggling
  - full-screen (Teleport to `body`) with Esc to exit

**useVncSession** (`composables/useVncSession.ts`)
- Wraps the noVNC `RFB` client and manages lifecycle + status.
- Manages `connected / connecting / disconnected` state and status messages.
- Handles credentials, errors, and view-only mode.
- Exposes `connect`, `disconnect`, `toggleViewOnly`, and `refreshViewport`.

## Connection Lifecycle (Per Host)

1. VNC Viewer renders a tile with a host URL and password.
2. The tile sets its container element and waits for a non-zero size.
3. Auto-connect triggers `useVncSession.connect()` once ready.
4. `RFB` connects via WebSocket, updating the status indicator.
5. `ResizeObserver` and `refreshViewport()` keep the canvas scaled to the tile.
6. Disconnect tears down the session; reconnect can be triggered manually.

## Design Notes & Constraints

- **Single password for all hosts:** The viewer uses one resolved password for every host.
- **WebSocket URLs required:** Host entries are normalized to `ws://` or `wss://`.
- **Deferred auto-connect:** Tiles do not connect until the host container is measurable.
- **Fullscreen behavior:** Each tile can be maximized independently via Teleport.

## Testing Coverage

- Host parsing is validated in `utils/__tests__/vncHosts.spec.ts`.
- No dedicated component tests currently cover multi-host rendering or VNC session lifecycle.

## Key Files

- `components/layout/RightSideTabs.vue`
- `components/workspace/tools/VncViewer.vue`
- `components/workspace/tools/VncHostTile.vue`
- `composables/useVncSession.ts`
- `utils/vncHosts.ts`
- `utils/__tests__/vncHosts.spec.ts`
