## Context

The standalone adapter (`packages/adapters/standalone/src/main.ts`) is the entry point for non-Electron deployments. It creates the DI container, configures auth, and starts the Express server. Currently it hardcodes paths and mixes config with runtime state.

The Express server (`packages/backend/src/api/server.ts`) calls `app.listen(port)` without a host parameter, always binding to all interfaces.

## Goals / Non-Goals

**Goals:**
- Allow external control of data directory, bind address, and config file location via environment variables
- Separate read-only config from server-managed runtime state
- All changes backwards compatible — no env vars = same behavior as before

**Non-Goals:**
- Changing the Electron adapter or unified config service internals
- Adding NixOS-specific code to this repo

## Decisions

### 1. Environment variable naming

| Env var | Purpose | Default |
|---------|---------|---------|
| `QUIQR_DATA_DIR` | Data directory (replaces `~/.quiqr-standalone`) | `~/.quiqr-standalone` |
| `HOST` / `BIND_ADDRESS` | Server bind address | `0.0.0.0` |
| `QUIQR_CONFIG_FILE` | Path to `instance_settings.json` | `<dataDir>/instance_settings.json` |
| `PORT` | Server port (already exists) | `5150` |

**Rationale:** `QUIQR_DATA_DIR` is namespaced to avoid collisions. `HOST` and `PORT` follow common conventions (Heroku, Railway, etc.). `BIND_ADDRESS` is a fallback for environments where `HOST` has a different meaning. `QUIQR_CONFIG_FILE` is namespaced since it's Quiqr-specific.

### 2. Bind address: add `host` to `ServerOptions`

Add optional `host?: string` to `ServerOptions` in `server.ts`. Change `app.listen(port)` to `app.listen(port, host)`. When `host` is undefined, Express defaults to `0.0.0.0` (no behavior change).

**Reference:** `packages/backend/src/api/server.ts` lines 31-55 (`ServerOptions`) and 369-384 (`startServer`).

### 3. Runtime state separation

Create a new file `runtime_state.json` in `userDataPath` for server-managed mutable state. Currently the only item is `auth.session.secret`.

On startup:
1. Read config from `instance_settings.json` (or `QUIQR_CONFIG_FILE`)
2. Read runtime state from `runtime_state.json` in `userDataPath`
3. If session secret is in runtime state, use it. Otherwise generate one and write to runtime state.
4. Never write to `instance_settings.json`

This change is localized to `main.ts` — the session secret logic (lines 95-112) already reads/writes directly, bypassing the unified config service. We just redirect the writes to `runtime_state.json`.

### 4. Config file override via `QUIQR_CONFIG_FILE`

When `QUIQR_CONFIG_FILE` is set, copy it to the data directory as `instance_settings.json` on startup (or symlink). This way the unified config service still reads from its expected location, but the source is externally managed.

**Alternative considered:** Teaching unified config service about external config paths — rejected because it would require changes across the config stack. Simply making the external file available at the expected location is simpler.

**Simpler alternative:** Just pass `QUIQR_CONFIG_FILE` path to the container creation so the config service reads from there. Let me check if `createContainer` supports this... The `createContainer` takes `userDataPath` and the config store reads from that directory. The simplest approach: if `QUIQR_CONFIG_FILE` is set, copy/symlink it into `userDataPath/instance_settings.json` before creating the container.

## Risks / Trade-offs

**Risk: QUIQR_CONFIG_FILE gets stale if source changes while server is running**
Mitigation: Copy happens on startup only. NixOS restarts the service on config change, so this is fine.

**Risk: runtime_state.json permissions**
Mitigation: The server creates it in `userDataPath` which it already has write access to. Same permissions as before.
