# Restore Build Actions

## Summary

Build actions — custom commands (e.g., Quarto render, Pandoc export) triggered from the form toolbar — were lost during the big rewrite. The entire backend stack (type schemas, execution service, API handlers, frontend API client) is intact. The gap is purely in the frontend UI: `SukohForm` accepts a `buildActions` prop but never renders buttons or wires the `onDocBuild` callback.

This change restores the build actions UI and adds a safe file download endpoint for `stdout_type: "file_path"` results.

## Motivation

Build actions were a key feature for users with Quarto, Pandoc, or custom build workflows. The CHANGELOG (v0.19.0–v0.19.7) documents:
- Build action buttons on single and collection forms
- Loading spinners during execution
- `stdout_type: "file_path"` to open generated files
- `site_path_replace` / `document_path_replace` for WSL path mapping
- Custom variables in build action definitions
- Timeout prevention for long-running actions

All of this backend logic still works. Only the UI trigger is missing.

## Scope

### In scope
1. Render build action buttons in `SukohForm` next to the PAGE ASSIST button
2. Wire `onDocBuild` callback in `Single.tsx` and `CollectionItem.tsx`
3. Auto-save document before executing a build action
4. Per-button loading state using MUI `LoadingButton`
5. Show build results: snackbar for success/error, console output panel for stdout/stderr
6. New backend endpoint for safe file download (for `stdout_type: "file_path"`)
7. File download restricted to site directory with `realpath` validation to prevent path traversal

### Out of scope
- Readonly terminal UI (GitHub Actions style) — future proposal
- Streaming build output via SSE — future proposal
- New build action types or schema changes

## What exists (no changes needed)

| Layer | Status | Location |
|-------|--------|----------|
| Zod schemas | Complete | `packages/types/src/schemas/config.ts` (lines 11-46) |
| API response schema | Complete | `packages/types/src/schemas/api.ts` (lines 129-134) |
| BuildActionService | Complete | `packages/backend/src/build-actions/build-action-service.ts` |
| WorkspaceService integration | Complete | `packages/backend/src/services/workspace/workspace-service.ts` |
| API handlers | Complete | `single-handlers.ts`, `collection-handlers.ts` |
| Frontend API client | Complete | `packages/frontend/src/api.ts` (`buildSingle`, `buildCollectionItem`) |
| Container props | Complete | `Single.tsx` and `CollectionItem.tsx` pass `buildActions` to `SukohForm` |

## What needs to change

### 1. SukohForm — render build action buttons
**File:** `packages/frontend/src/components/SukohForm/index.tsx`

- Destructure `buildActions` and `onDocBuild` from props (currently ignored)
- For each build action, render a `LoadingButton` (from `@mui/lab`) positioned next to the PAGE ASSIST button
- Use `button_text` (or fall back to `title`, then `key`) as button label
- Track per-button loading state with a `Set<string>` of running action keys
- On click: auto-save, then call `onDocBuild(buildAction)`

### 2. Single.tsx — wire onDocBuild
**File:** `packages/frontend/src/containers/WorkspaceMounted/Single.tsx`

- Add `handleDocBuild` callback that calls `api.buildSingle(siteKey, workspaceKey, singleKey, buildAction.key)`
- Pass as `onDocBuild` prop to `SukohForm`
- Handle result: snackbar on success, snackbar on error
- If `stdout_type === "file_path"`: trigger file download via new endpoint

### 3. CollectionItem.tsx — wire onDocBuild
**File:** `packages/frontend/src/containers/WorkspaceMounted/Collection/CollectionItem.tsx`

- Same pattern as Single.tsx but calls `api.buildCollectionItem()`

### 4. File download endpoint (new)
**File:** `packages/backend/src/api/handlers/file-handlers.ts` (new or existing)

- `GET /api/sites/:siteKey/workspaces/:workspaceKey/file-download?path=<path>`
- Resolve the requested path with `fs.realpath()`
- Verify the resolved path is under the workspace's site root directory
- Reject with 403 if path is outside the site directory (prevents path traversal)
- Stream the file with `Content-Disposition: attachment`

### 5. Console output panel
**File:** `packages/frontend/src/components/SukohForm/BuildActionOutput.tsx` (new)

- Collapsible panel below the form showing stdout/stderr from the most recent build action
- Simple `<pre>` block, auto-scrolls to bottom
- Dismissible

## Security

The file download endpoint must guard against path traversal:
- Use `fs.realpath()` to resolve symlinks and `..` sequences
- Compare resolved path against the workspace's site root
- Reject any path outside the site directory with HTTP 403
- This prevents malicious model YAML or crafted build output from exfiltrating arbitrary files

## Risk

Low — this is a restoration, not a new feature. The backend is battle-tested and unchanged. The frontend work is straightforward button rendering and API calls.
