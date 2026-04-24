## 1. Schema: Add variables to instance settings

- [x] 1.1 Add `variables: z.record(z.string(), z.string()).default({})` to `instanceSettingsSchema` in `packages/types/src/schemas/config.ts`
- [x] 1.2 Rebuild types package (`npm run build -w @quiqr/types`)

## 2. Backend: Merge global variables into build action execution

- [x] 2.1 In `WorkspaceService.buildSingle()`, read global variables from `this.container.unifiedConfig.getInstanceSetting('variables')` and merge with `executeDict.variables` (global overrides YAML defaults) before passing to `buildActionService.runAction()`
- [x] 2.2 In `WorkspaceService.buildCollectionItem()`, apply the same merge pattern
- [x] 2.3 Write a unit test verifying that global variables override YAML defaults and that YAML-only and global-only variables both work

## 3. Frontend: Variables preferences UI

- [x] 3.1 Create `PrefsVariables.tsx` in `packages/frontend/src/containers/Prefs/` — table of variable name-value pairs with add, edit, and delete. Follow `PrefsGit.tsx` pattern for instance settings mutation.
- [x] 3.2 Add variable name validation: alphanumeric and underscores only, no duplicates
- [x] 3.3 Add empty state message explaining what variables are and how they're used in build actions
- [x] 3.4 Register the Variables section in the Preferences navigation/routing

## 4. Verification

- [x] 4.1 Verify TypeScript compiles cleanly for both backend and frontend
- [x] 4.2 Test end-to-end: define a global variable in Preferences, run a build action that uses it, verify the global value is used instead of the YAML default
- [x] 4.3 Run all existing tests to verify no regressions
