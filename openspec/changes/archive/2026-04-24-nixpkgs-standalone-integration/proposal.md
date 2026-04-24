# NixOS/nixpkgs Standalone Adapter Integration

## Summary

Three changes to the standalone adapter to integrate cleanly with NixOS packaging, Docker/Kubernetes, and any externally-managed deployment. All changes are backwards compatible.

## Motivation

The NixOS module (`quiqr-server.nix`) runs quiqr-server as a systemd service with an optional nginx reverse proxy. Three issues prevent clean integration:

1. **Data directory is hardcoded** to `~/.quiqr-standalone` — NixOS services run as dedicated users and need to control the data path via environment variable, not by hacking `HOME`.

2. **No bind address control** — the server always binds to `0.0.0.0`. Behind nginx, it should bind to `127.0.0.1` only. No env var exists for this.

3. **Config and runtime state are mixed** — `instance_settings.json` is both read (config) and written (auto-generated session secret). NixOS generates config declaratively on each service start, which conflicts with server-written state in the same file.

## Scope

### In scope

1. `QUIQR_DATA_DIR` env var to override the default data directory
2. `HOST` / `BIND_ADDRESS` env var for server bind address, passed through `startServer()`
3. Separate `runtime_state.json` for server-managed state (session secret), keeping `instance_settings.json` as read-only config
4. Optional `QUIQR_CONFIG_FILE` env var to point to an external config file

### Out of scope

- NixOS module itself (lives in nixpkgs, not this repo)
- Changes to Electron adapter
- Changes to the unified config service internals (only standalone adapter and server.ts)
