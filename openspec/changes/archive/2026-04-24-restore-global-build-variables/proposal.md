# Restore Global Build Action Variables

## Summary

Build actions support per-action default variables defined in the model YAML (`execute.variables`). The old Quiqr also had a **global variable override** mechanism: users could define variables in Preferences (stored in `prefs.variables`) that would override the YAML defaults. This allowed different machines to configure different executable paths (e.g., `NIX_EXEC=/run/current-system/sw/bin/nix` on NixOS vs `/usr/bin/nix` on Ubuntu) without modifying the site model.

This functionality was lost in the rewrite. The `BuildActionService.replacePathVars()` only uses YAML-defined defaults — it has no access to global overrides.

## Motivation

Real-world example from the `msa-packaging` site model:

```yaml
buildActions:
  - key: magic_make_pdf
    button_text: Build PDF
    execute:
      variables:
        - name: "NIX_EXEC"
          value: /usr/bin/nix
      unix:
        command: '%NIX_EXEC'
        args: ['run', 'github:...#quarto-for-quiqr', '--', '%DOCUMENT_PATH']
```

The YAML defines `NIX_EXEC=/usr/bin/nix` as a default. But on a NixOS machine, nix lives at `/run/current-system/sw/bin/nix`. Without global overrides, the user must either:
- Edit the shared model YAML (breaks it for other users)
- Or not use build actions at all

The old system solved this: define `NIX_EXEC` in Preferences with the machine-specific value. The global value takes precedence over the YAML default.

## Scope

### In scope

1. Add `variables` field to `instanceSettingsSchema` — a key-value map of global build action variables
2. Wire `BuildActionService` to read global variables from instance settings via the DI container
3. Merge logic: global variables override YAML defaults (global wins when both define the same name)
4. Add a Variables section to the Preferences UI for managing global variables (add, edit, remove)
5. Support the `%VARIABLE_NAME` replacement syntax (existing in `replacePathVars`)

### Out of scope

- Environment variable overrides (e.g., `QUIQR_VAR_NIX_EXEC`) — future enhancement
- Per-site variable overrides in site settings — future enhancement
- Changing the replacement syntax (`%VAR` stays, no `{{VAR}}` migration)

## What exists

| Component | Status |
|-----------|--------|
| `BuildActionService.replacePathVars()` | Works — replaces `%VAR` with values from `execute.variables` |
| `instanceSettingsSchema` | Has no `variables` field |
| Preferences UI | Has no Variables section |
| Documentation | `packages/docs/docs/configuration/variables.md` exists and describes the old system |

## What needs to change

### 1. Schema: add `variables` to instance settings
**File:** `packages/types/src/schemas/config.ts`

Add to `instanceSettingsSchema`:
```typescript
variables: z.record(z.string(), z.string()).default({})
```

### 2. Backend: pass global variables to BuildActionService
**File:** `packages/backend/src/build-actions/build-action-service.ts`

- Add a `globalVariables` parameter to `runAction()` (or read from container)
- In `replacePathVars()`, merge global variables with per-action variables, with global taking precedence

**File:** `packages/backend/src/services/workspace/workspace-service.ts`

- Read global variables from unified config (`container.unifiedConfig.getInstanceSetting('variables')`)
- Pass to `BuildActionService.runAction()`

### 3. Frontend: Variables preferences UI
**File:** `packages/frontend/src/containers/Prefs/PrefsVariables.tsx` (new)

- Table showing variable name + value pairs
- Add, edit, and remove variables
- Saves to `instance_settings.json` via `updateInstanceSettings` API

**File:** `packages/frontend/src/containers/Prefs/index.tsx` (or equivalent routing)

- Add Variables tab/section to preferences navigation
