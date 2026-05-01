## Context

Build actions support `%VARIABLE_NAME` substitution in commands and arguments. Currently, `BuildActionService.replacePathVars()` only uses variables defined per-action in the model YAML (`execute.variables`). The old Quiqr stored global variable overrides in `prefs.variables` which took precedence over YAML defaults — this allowed different machines to use different executable paths without modifying shared model files.

The unified config architecture already has `instanceSettingsSchema` (stored in `instance_settings.json`) which is the correct home for machine-specific settings. Variables fit naturally alongside `storage`, `git`, and `hugo` settings.

Reference implementations:
- `PrefsHugo.tsx` — existing instance settings UI with toggle switches
- `PrefsGit.tsx` — existing instance settings UI with text input
- `BuildActionService.replacePathVars()` — existing variable replacement logic

## Goals / Non-Goals

**Goals:**
- Store global build action variables in `instance_settings.json` under a `variables` key
- Merge global variables with per-action YAML variables, with global overrides winning
- Provide a Preferences UI section for managing global variables (CRUD on key-value pairs)
- Work identically in both Electron and standalone modes

**Non-Goals:**
- Environment variable overrides (`QUIQR_VAR_*`) — future enhancement
- Per-site variable overrides in site settings — future enhancement
- Changing the `%VAR` replacement syntax
- Migration from old `prefs.variables` format (the old config format is gone)

## Decisions

### 1. Store variables in instance settings, not user preferences

Variables go in `instanceSettingsSchema` as `variables: z.record(z.string(), z.string()).default({})`.

**Rationale:** Variables are machine-specific (executable paths differ per machine), not user-specific. In standalone multi-user mode, all users on the same machine should share the same `NIX_EXEC` path. Instance settings is the right layer.

**Alternative considered:** User preferences — rejected because executable paths are a property of the machine, not the user's preference.

### 2. Merge strategy: global overrides YAML defaults

When resolving variables for a build action:
1. Start with YAML-defined variables (`execute.variables`) as the base
2. Overlay global variables from instance settings
3. Global wins when both define the same variable name

```
YAML:    NIX_EXEC=/usr/bin/nix     (default)
Global:  NIX_EXEC=/run/current/.../nix  (override)
Result:  NIX_EXEC=/run/current/.../nix  (global wins)
```

**Rationale:** The YAML provides sensible defaults for the model. The global override is the user's machine-specific correction. This matches the old behavior.

### 3. Pass global variables through WorkspaceService, not directly to BuildActionService

`WorkspaceService.buildSingle()` and `buildCollectionItem()` already call `BuildActionService.runAction()`. They will read global variables from the unified config and pass them as a new parameter.

**Rationale:** Keeps `BuildActionService` decoupled from config — it receives variables, doesn't fetch them. The `WorkspaceService` already has access to the unified config via its dependencies.

### 4. Preferences UI: simple key-value table with add/remove

A new `PrefsVariables.tsx` component renders a table of variable name-value pairs with:
- Text fields for name and value
- Add button to append a new row
- Delete button per row
- Save persists all variables at once via `updateInstanceSettings`

**Rationale:** Matches the existing Preferences pattern. Variables are simple key-value pairs — no need for complex forms. Reference: `PrefsGit.tsx` for the instance settings save pattern.

## Risks / Trade-offs

**Risk: Variable name collisions with built-in variables**
Users could define `SITE_PATH` or `DOCUMENT_PATH` as a global variable, overriding built-in path variables.
Mitigation: Built-in variables (`%SITE_PATH`, `%DOCUMENT_PATH`) are replaced first in `replacePathVars()`, before custom variables. This order is already correct and prevents collisions.

**Risk: Stale variables after instance settings change**
If a user changes a global variable while a workspace is mounted, the next build action will pick up the new value immediately since `WorkspaceService` reads from the config on each build.
Mitigation: Not an issue — reading on each build is the correct behavior.
