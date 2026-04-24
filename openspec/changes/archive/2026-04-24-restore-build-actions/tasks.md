## 1. Backend: File download endpoint

- [x] 1.1 Add file-download handler in `packages/backend/src/api/handlers/file-download-handler.ts` — accepts `path` query param, resolves with `fs.realpath()`, validates path is under site root, streams file with `Content-Disposition: attachment`
- [x] 1.2 Register the file-download route in `packages/backend/src/api/server.ts` under `GET /api/sites/:siteKey/workspaces/:workspaceKey/file-download`
- [x] 1.3 Add `fileDownload` method to `packages/frontend/src/api.ts` that constructs the download URL and triggers a browser download (e.g., `window.open` or hidden anchor click)
- [x] 1.4 Write tests for path traversal rejection (symlinks, `..` sequences, absolute paths outside site root)

## 2. Frontend: SukohForm build action buttons

- [x] 2.1 Destructure `buildActions` and `onDocBuild` from props in `SukohForm/index.tsx`
- [x] 2.2 Render `LoadingButton` (from `@mui/lab`) for each build action in the top-right area next to PAGE ASSIST button, using `button_text` / `title` / `key` as label
- [x] 2.3 Add `loadingActions` state (`Set<string>`) to track per-button loading, set loading on click, clear on result/error

## 3. Frontend: Auto-save before build

- [x] 3.1 In the build action click handler inside `SukohForm`, call `saveContent()` first if form is dirty, then invoke `onDocBuild` after save completes

## 4. Frontend: Wire onDocBuild in containers

- [x] 4.1 Add `handleDocBuild` callback in `Single.tsx` that calls `api.buildSingle(siteKey, workspaceKey, singleKey, buildAction.key)` and returns the result
- [x] 4.2 Add `handleDocBuild` callback in `CollectionItem.tsx` that calls `api.buildCollectionItem(siteKey, workspaceKey, collectionKey, collectionItemKey, buildAction.key)` and returns the result
- [x] 4.3 Pass `onDocBuild` prop to `SukohForm` in both containers

## 5. Frontend: Result handling

- [x] 5.1 On build success: show success snackbar with action name
- [x] 5.2 On build error: show error snackbar with action name and error message
- [x] 5.3 On `stdout_type === "file_path"`: trigger file download using the `fileDownload` API method from task 1.3
- [x] 5.4 Pass stdout/stderr content back to `SukohForm` for console output display

## 6. Frontend: Build action console output panel

- [x] 6.1 Create `BuildActionOutput` component in `packages/frontend/src/components/SukohForm/BuildActionOutput.tsx` — collapsible panel with monospace `<pre>` block, stderr in distinct style, dismiss button
- [x] 6.2 Add output truncation to last 500 lines with truncation message
- [x] 6.3 Add `buildOutput` state to `SukohForm` to hold the latest build result, render `BuildActionOutput` below form fields when output is present
- [x] 6.4 Replace previous output when a new build action is executed

## 7. Verification

- [ ] 7.1 Test with a site model that defines `build_actions` on a single — verify buttons appear, click triggers execution, output shows
- [ ] 7.2 Test with a collection item that defines `build_actions` — same verification
- [ ] 7.3 Test `stdout_type: "file_path"` — verify file download triggers and path restriction works
- [x] 7.4 Test with no `build_actions` defined — verify no buttons appear, no regressions
- [x] 7.5 Verify TypeScript compiles cleanly (`npx tsc --noEmit` in frontend package)
