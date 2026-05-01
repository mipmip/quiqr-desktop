## ADDED Requirements

### Requirement: QUIQR_DATA_DIR environment variable

The standalone adapter SHALL support a `QUIQR_DATA_DIR` environment variable that overrides the default data directory (`~/.quiqr-standalone`).

#### Scenario: QUIQR_DATA_DIR is set
- **WHEN** the `QUIQR_DATA_DIR` environment variable is set to `/var/lib/quiqr`
- **THEN** the server SHALL use `/var/lib/quiqr` as the `userDataPath`
- **AND** all data files (config, logs, sites, runtime state) SHALL be stored under that directory

#### Scenario: QUIQR_DATA_DIR is not set
- **WHEN** the `QUIQR_DATA_DIR` environment variable is not set
- **THEN** the server SHALL default to `~/.quiqr-standalone` (unchanged behavior)

### Requirement: HOST / BIND_ADDRESS environment variable

The standalone adapter SHALL support `HOST` and `BIND_ADDRESS` environment variables to control the server bind address. `HOST` SHALL take precedence over `BIND_ADDRESS`.

#### Scenario: HOST is set
- **WHEN** the `HOST` environment variable is set to `127.0.0.1`
- **THEN** the server SHALL bind to `127.0.0.1` only
- **AND** the server SHALL NOT be accessible from other network interfaces

#### Scenario: BIND_ADDRESS is set (HOST not set)
- **WHEN** `HOST` is not set and `BIND_ADDRESS` is set to `127.0.0.1`
- **THEN** the server SHALL bind to `127.0.0.1`

#### Scenario: Neither HOST nor BIND_ADDRESS is set
- **WHEN** neither environment variable is set
- **THEN** the server SHALL bind to `0.0.0.0` (all interfaces, unchanged behavior)

### Requirement: Server bind address in ServerOptions

`ServerOptions` in `server.ts` SHALL accept an optional `host` parameter. `startServer()` SHALL pass it to `app.listen(port, host)`.

#### Scenario: host provided in ServerOptions
- **WHEN** `startServer()` is called with `{ host: '127.0.0.1', port: 5150 }`
- **THEN** Express SHALL listen on `127.0.0.1:5150`

#### Scenario: host not provided in ServerOptions
- **WHEN** `startServer()` is called without a `host` option
- **THEN** Express SHALL listen on all interfaces (Express default behavior)

### Requirement: Separate runtime state from config

The standalone adapter SHALL separate server-managed runtime state from read-only configuration by using a dedicated `runtime_state.json` file in the data directory.

#### Scenario: Session secret auto-generation
- **WHEN** the server starts and no session secret exists in `runtime_state.json`
- **THEN** the server SHALL generate a random session secret
- **AND** persist it to `runtime_state.json` (NOT `instance_settings.json`)

#### Scenario: Session secret persistence across restarts
- **WHEN** the server restarts and `runtime_state.json` contains a session secret
- **THEN** the server SHALL reuse the persisted secret
- **AND** existing user sessions SHALL remain valid

#### Scenario: External config not overwritten
- **WHEN** the server starts with a NixOS-managed `instance_settings.json`
- **THEN** the server SHALL NOT write to `instance_settings.json`
- **AND** only `runtime_state.json` SHALL be written by the server

### Requirement: QUIQR_CONFIG_FILE environment variable

The standalone adapter SHALL support a `QUIQR_CONFIG_FILE` environment variable to specify an external config file path.

#### Scenario: QUIQR_CONFIG_FILE is set
- **WHEN** `QUIQR_CONFIG_FILE` is set to `/etc/quiqr/instance_settings.json`
- **THEN** the server SHALL copy that file to `<userDataPath>/instance_settings.json` on startup
- **AND** the unified config service SHALL read from the copied file

#### Scenario: QUIQR_CONFIG_FILE is not set
- **WHEN** `QUIQR_CONFIG_FILE` is not set
- **THEN** the server SHALL read config from `<userDataPath>/instance_settings.json` (unchanged behavior)
