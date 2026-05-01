## 1. QUIQR_DATA_DIR environment variable

- [x] 1.1 In `packages/adapters/standalone/src/main.ts`, change `userDataPath` to read from `process.env.QUIQR_DATA_DIR` with fallback to `join(homedir(), '.quiqr-standalone')`

## 2. HOST / BIND_ADDRESS environment variable

- [x] 2.1 Add optional `host?: string` to `ServerOptions` in `packages/backend/src/api/server.ts`
- [x] 2.2 Change `app.listen(port)` to `app.listen(port, host)` in `startServer()`, include host in the log output
- [x] 2.3 In `packages/adapters/standalone/src/main.ts`, read `HOST` / `BIND_ADDRESS` from env and pass `host` to `startServer()`

## 3. Separate runtime state from config

- [x] 3.1 In `main.ts`, change the session secret logic to read/write `runtime_state.json` instead of `instance_settings.json`
- [x] 3.2 On startup, if `runtime_state.json` has a session secret, use it. Otherwise generate and persist to `runtime_state.json`.
- [x] 3.3 Remove the code that writes session secret back to `instance_settings.json`

## 4. QUIQR_CONFIG_FILE environment variable

- [x] 4.1 In `main.ts`, if `QUIQR_CONFIG_FILE` is set, copy the file to `<userDataPath>/instance_settings.json` before creating the container
- [x] 4.2 Ensure the data directory exists before copying (use `mkdirSync` with `recursive: true`)

## 5. Verification

- [x] 5.1 Verify TypeScript compiles cleanly (`npx tsc --noEmit` for backend and standalone adapter)
- [x] 5.2 Run all backend tests to verify no regressions
- [x] 5.3 Test standalone startup with default env (no env vars set) — verify unchanged behavior
