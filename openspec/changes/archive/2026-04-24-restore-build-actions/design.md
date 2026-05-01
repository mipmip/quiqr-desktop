## Context

Build actions allow site developers to define custom commands (Quarto render, Pandoc export, etc.) in their model YAML. These commands execute on the backend and return results to the frontend. The feature was fully functional in v0.19.x but the UI layer was lost during the v0.21–v0.22 rewrite.

The backend stack is complete and unchanged:
- `BuildActionService` handles command execution with platform detection, variable substitution, and path replacements
- `WorkspaceService.buildSingle()` and `buildCollectionItem()` find the action config and delegate to `BuildActionService`
- API handlers and frontend API client methods exist and are wired

The gap is:
1. `SukohForm` accepts `buildActions` prop but never renders buttons
2. `Single.tsx` and `CollectionItem.tsx` never pass `onDocBuild` callback
3. No mechanism to download files when `stdout_type: "file_path"`

## Goals / Non-Goals

**Goals:**
- Restore build action buttons in the form toolbar (top-right, alongside PAGE ASSIST)
- Auto-save before executing a build action
- Show per-button loading state during execution
- Display build output in a collapsible console panel and snackbar notifications
- Serve generated files for download when `stdout_type: "file_path"`, restricted to site directory

**Non-Goals:**
- Streaming build output via SSE (future: readonly terminal UI)
- Changes to the build action schema or backend execution logic
- Support for downloading files outside the site directory

## Decisions

### 1. Button placement: top-right action bar alongside PAGE ASSIST

Build action buttons render in the same position area as the PAGE ASSIST button (top-right of form). Each `BuildAction` gets its own `LoadingButton`.

**Rationale:** Build actions and AI assist are both document-level operations. Grouping them creates a consistent action bar. The save FAB stays at bottom-right as the primary action.

**Alternative considered:** Bottom toolbar next to save FAB — rejected because it crowds the fixed-position area and mixes save (always-present) with contextual actions.

### 2. MUI LoadingButton for per-action loading state

Use `@mui/lab/LoadingButton` with a `Set<string>` tracking which action keys are currently running.

**Rationale:** Each action runs independently and may take different amounts of time. Users need to see which specific action is running. `LoadingButton` provides this out of the box with no custom spinner logic.

### 3. Auto-save before build

When a build action button is clicked, the form auto-saves first (if dirty), then executes the build action. This ensures the build operates on the latest content.

**Rationale:** Build actions operate on the saved file on disk. Running a build on stale content would produce confusing results. The old implementation also saved before building.

**Flow:**
```
User clicks build → saveContent() → await save complete → api.buildSingle/buildCollectionItem() → handle result
```

### 4. File download via path-restricted endpoint

New endpoint: `GET /api/sites/:siteKey/workspaces/:workspaceKey/file-download?path=<relative-or-absolute-path>`

Security:
1. Resolve the path with `fs.realpath()` to eliminate symlinks and `..` sequences
2. Look up the workspace's site root directory via `WorkspaceService`
3. Verify `resolvedPath.startsWith(siteRoot)` — reject with 403 if false
4. Stream file with `Content-Disposition: attachment; filename="<basename>"`

**Rationale:** The old Electron code used `shell.openPath()` which doesn't work in standalone mode. A download endpoint works in both runtimes. Path restriction to the site directory prevents path traversal attacks from malicious model YAML or crafted build output.

**Alternative considered:** Signed token approach — more flexible but adds unnecessary complexity for this use case. Build outputs should always be within the site directory.

### 5. Console output panel: simple collapsible pre block

A `BuildActionOutput` component renders below the form fields when build output is available. It shows:
- Action name and status (success/error)
- Stdout content in a `<pre>` block
- Stderr content (if any) in a visually distinct error block
- Dismiss button to collapse

State is local to `SukohForm` — no global state needed since output is per-form.

**Rationale:** Keep it simple for now. The future "GitHub Actions style terminal" proposal will replace this with a proper terminal component that can also show Hugo build output, git sync output, etc.

### 6. Communication pattern follows existing architecture

```
SukohForm (button click)
    │
    ▼
onDocBuild callback (in Single.tsx / CollectionItem.tsx)
    │
    ▼
api.buildSingle() / api.buildCollectionItem()  (packages/frontend/src/api.ts)
    │
    ▼
main-process-bridge HTTP POST
    │
    ▼
Express handler → WorkspaceService → BuildActionService
    │
    ▼
spawn() → collect stdout/stderr → return BuildActionResult
    │
    ▼
Frontend handles result:
  - stdout_type === "file_path" → trigger download via file-download endpoint
  - otherwise → show in console panel + snackbar
```

No new patterns introduced. The file-download endpoint is the only new backend route.

## Risks / Trade-offs

**Risk: Build action hangs indefinitely**
The current `BuildActionService` has no timeout. A command that never exits will leave the button in loading state forever.
Mitigation: Out of scope for this change. Document as a known limitation. A future change can add configurable timeouts.

**Risk: Large stdout output**
A build action that produces megabytes of stdout could cause memory issues in the console panel.
Mitigation: Truncate displayed output to last 500 lines in `BuildActionOutput`. Full output is still in backend logs.

**Risk: File download path validation race condition**
Between `realpath` check and file read, the file could be replaced with a symlink.
Mitigation: Use `O_NOFOLLOW` flag when opening the file, or re-check after open. Low risk in practice since the attacker would need filesystem access to the site directory.
