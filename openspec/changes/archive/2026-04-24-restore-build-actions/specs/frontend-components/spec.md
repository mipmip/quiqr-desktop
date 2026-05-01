## ADDED Requirements

### Requirement: Build action buttons in SukohForm

SukohForm SHALL render a `LoadingButton` for each entry in the `buildActions` prop. Buttons SHALL be positioned in the top-right action bar alongside the PAGE ASSIST button. The button label SHALL use `button_text`, falling back to `title`, then `key`.

#### Scenario: Build actions defined in model
- **WHEN** a single or collection has `build_actions` defined in its model config
- **THEN** SukohForm SHALL render one `LoadingButton` per build action in the top-right area
- **AND** each button SHALL display the action's `button_text` (or `title`, or `key` as fallback)

#### Scenario: No build actions defined
- **WHEN** a single or collection has no `build_actions` or an empty array
- **THEN** SukohForm SHALL not render any build action buttons
- **AND** the PAGE ASSIST button (if present) SHALL remain unaffected

#### Scenario: Build action button clicked
- **WHEN** user clicks a build action button
- **THEN** the system SHALL auto-save the form if there are unsaved changes
- **AND** after save completes, the system SHALL call the `onDocBuild` callback with the `BuildAction` object
- **AND** the clicked button SHALL show a loading spinner until the build completes

#### Scenario: Multiple build actions
- **WHEN** multiple build actions are defined
- **THEN** each SHALL have its own independent loading state
- **AND** clicking one button SHALL NOT disable or affect other build action buttons

### Requirement: Build action result handling in Single and CollectionItem containers

`Single.tsx` and `CollectionItem.tsx` SHALL pass an `onDocBuild` handler to `SukohForm` that calls `api.buildSingle()` or `api.buildCollectionItem()` respectively, and handles the result.

#### Scenario: Successful build action on a single
- **WHEN** a build action completes successfully on a single
- **THEN** the container SHALL show a success snackbar with the action name
- **AND** the build output SHALL be available in the console output panel

#### Scenario: Successful build action on a collection item
- **WHEN** a build action completes successfully on a collection item
- **THEN** the container SHALL show a success snackbar with the action name
- **AND** the build output SHALL be available in the console output panel

#### Scenario: Build action returns file_path stdout type
- **WHEN** a build action completes with `stdout_type === "file_path"`
- **THEN** the system SHALL trigger a file download via the file-download endpoint
- **AND** the file path from stdout SHALL be passed to the download endpoint

#### Scenario: Build action fails
- **WHEN** a build action fails (non-zero exit code or error)
- **THEN** the container SHALL show an error snackbar with the action name and error message
- **AND** any stderr output SHALL be displayed in the console output panel

### Requirement: Build action console output panel

SukohForm SHALL include a collapsible `BuildActionOutput` component that displays stdout and stderr from the most recent build action execution.

#### Scenario: Build action produces output
- **WHEN** a build action completes (success or error)
- **AND** there is stdout or stderr content
- **THEN** the console output panel SHALL appear below the form fields
- **AND** stdout SHALL be displayed in a monospace `<pre>` block
- **AND** stderr SHALL be visually distinct (e.g., red text or separate section)

#### Scenario: Dismiss console output
- **WHEN** the user clicks the dismiss/close button on the console output panel
- **THEN** the panel SHALL collapse and hide

#### Scenario: Large output truncation
- **WHEN** build output exceeds 500 lines
- **THEN** the panel SHALL display only the last 500 lines
- **AND** a message SHALL indicate that output was truncated

#### Scenario: New build action replaces previous output
- **WHEN** a new build action is executed while previous output is displayed
- **THEN** the previous output SHALL be replaced with the new output
