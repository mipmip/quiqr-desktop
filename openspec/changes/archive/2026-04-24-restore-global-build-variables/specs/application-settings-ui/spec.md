## ADDED Requirements

### Requirement: Variables section in Preferences UI

The Preferences screen SHALL include a "Variables" section that allows users to manage global build action variables stored in instance settings.

#### Scenario: Viewing existing variables
- **WHEN** user navigates to Preferences > Variables
- **THEN** the system SHALL display a table showing all defined variable names and values
- **AND** each row SHALL have a delete button

#### Scenario: Adding a new variable
- **WHEN** user clicks "Add Variable" and enters a name and value
- **THEN** the system SHALL save the variable to `instance_settings.json` under `variables`
- **AND** the table SHALL update to show the new variable
- **AND** a success snackbar SHALL confirm the save

#### Scenario: Editing an existing variable value
- **WHEN** user modifies the value of an existing variable and saves
- **THEN** the system SHALL update the variable in `instance_settings.json`
- **AND** a success snackbar SHALL confirm the update

#### Scenario: Removing a variable
- **WHEN** user clicks the delete button on a variable row
- **THEN** the system SHALL remove the variable from `instance_settings.json`
- **AND** the table SHALL update to reflect the removal

#### Scenario: Empty state
- **WHEN** no variables are defined
- **THEN** the system SHALL display an empty state message explaining what variables are for
- **AND** the "Add Variable" button SHALL be visible

#### Scenario: Variable name validation
- **WHEN** user enters a variable name with spaces or special characters (other than underscores)
- **THEN** the system SHALL show a validation error
- **AND** the variable SHALL NOT be saved

#### Scenario: Duplicate variable name
- **WHEN** user tries to add a variable with a name that already exists
- **THEN** the system SHALL show a validation error indicating the name is already in use
