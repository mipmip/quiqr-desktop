## ADDED Requirements

### Requirement: File download endpoint with path restriction

The backend SHALL expose a file download endpoint that streams a file from the workspace's site directory, with path traversal protection.

#### Scenario: Valid file download within site directory
- **WHEN** a GET request is made to `/api/sites/:siteKey/workspaces/:workspaceKey/file-download` with a `path` query parameter
- **AND** the resolved path is within the workspace's site root directory
- **THEN** the server SHALL stream the file with `Content-Disposition: attachment; filename="<basename>"`
- **AND** the response SHALL include an appropriate `Content-Type` header

#### Scenario: Path traversal attempt
- **WHEN** a GET request is made to the file-download endpoint
- **AND** the resolved path (after `fs.realpath()`) is outside the workspace's site root directory
- **THEN** the server SHALL respond with HTTP 403 Forbidden
- **AND** the response SHALL NOT reveal the resolved path

#### Scenario: File does not exist
- **WHEN** a GET request is made to the file-download endpoint
- **AND** the specified file does not exist
- **THEN** the server SHALL respond with HTTP 404 Not Found

#### Scenario: Path with symlinks
- **WHEN** the requested path contains symlinks
- **THEN** the server SHALL resolve the full real path before checking it is within the site directory
- **AND** if the resolved path is outside the site directory, the server SHALL respond with HTTP 403

#### Scenario: Authentication required
- **WHEN** a GET request is made to the file-download endpoint
- **AND** the request is in standalone mode with authentication enabled
- **THEN** the endpoint SHALL require valid authentication (JWT token)
- **AND** unauthenticated requests SHALL receive HTTP 401
