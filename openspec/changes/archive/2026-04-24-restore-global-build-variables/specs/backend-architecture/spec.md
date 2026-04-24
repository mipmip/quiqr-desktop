## ADDED Requirements

### Requirement: Global build action variables in instance settings

The `instanceSettingsSchema` SHALL include a `variables` field of type `z.record(z.string(), z.string()).default({})` for storing global build action variables.

#### Scenario: Instance settings with variables
- **WHEN** `instance_settings.json` contains a `variables` object with key-value pairs
- **THEN** the system SHALL parse and validate them as `Record<string, string>`
- **AND** the variables SHALL be accessible via `unifiedConfig.getInstanceSetting('variables')`

#### Scenario: Instance settings without variables
- **WHEN** `instance_settings.json` has no `variables` field
- **THEN** the system SHALL default to an empty object `{}`
- **AND** build actions SHALL still work using only their YAML-defined defaults

### Requirement: Variable merge with global override precedence

When executing a build action, `WorkspaceService` SHALL merge global variables from instance settings with per-action YAML variables. Global variables SHALL take precedence over YAML defaults when both define the same variable name.

#### Scenario: Global variable overrides YAML default
- **WHEN** a build action defines `execute.variables: [{name: "NIX_EXEC", value: "/usr/bin/nix"}]`
- **AND** instance settings defines `variables: {"NIX_EXEC": "/run/current-system/sw/bin/nix"}`
- **THEN** `%NIX_EXEC` SHALL be replaced with `/run/current-system/sw/bin/nix` (global wins)

#### Scenario: YAML variable with no global override
- **WHEN** a build action defines `execute.variables: [{name: "MY_VAR", value: "default_value"}]`
- **AND** instance settings does not define `MY_VAR`
- **THEN** `%MY_VAR` SHALL be replaced with `default_value` (YAML default used)

#### Scenario: Global variable with no YAML counterpart
- **WHEN** instance settings defines `variables: {"EXTRA_VAR": "extra_value"}`
- **AND** the build action does not define `EXTRA_VAR` in `execute.variables`
- **THEN** `%EXTRA_VAR` SHALL be replaced with `extra_value` in command and args

#### Scenario: Built-in variables are not overridable by global variables
- **WHEN** instance settings defines `variables: {"SITE_PATH": "/malicious/path"}`
- **THEN** `%SITE_PATH` SHALL still resolve to the actual workspace site path
- **AND** the built-in replacement SHALL take precedence over custom variables

### Requirement: WorkspaceService passes global variables to BuildActionService

`WorkspaceService.buildSingle()` and `WorkspaceService.buildCollectionItem()` SHALL read global variables from instance settings and pass them to `BuildActionService.runAction()` merged with the per-action YAML variables.

#### Scenario: buildSingle with global variables
- **WHEN** `buildSingle()` is called
- **THEN** it SHALL read global variables from `unifiedConfig.getInstanceSetting('variables')`
- **AND** merge them with `executeDict.variables` (global overriding YAML defaults)
- **AND** pass the merged variables to `BuildActionService.runAction()`

#### Scenario: buildCollectionItem with global variables
- **WHEN** `buildCollectionItem()` is called
- **THEN** it SHALL follow the same merge and pass pattern as `buildSingle()`
