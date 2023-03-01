# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added description in finding entity for API version 2

## 3.6.0 - 2023-01-23

## Added

- Functionality to upload descriptions as an issue attachment when they exceed
  the Jira character limit

## 3.5.0 - 2023-01-12

## Fixed

- Fixed ADF formatting issues

## 3.3.0 - 2022-12-20

## Fixed

- Fixed the `UNKNOWN_JIRA_API_VERSION` validation issue when hostname contains
  nesting.

## 3.2.0 - 2022-10-19

## Changed

- Added retry requests on response 500.
- Updated documentation to reflect that basic authentication is now deprecated
  and the API token is always needed.

## 3.1.0 - 2022-09-19

## Added

- new config option `redactIssueDescriptions`

## 3.0.2 - 2022-08-31

## Changed

- No longer write jira issues to disk. It isn't necessary

## Updated

- docs

## 3.0.1 - 2022-08-12

## Fixed

- updated sdk to fix rawData trimming issues
- remove gitleaks

## 3.0.0 - 2022-04-29

### BREAKING

- exported function createUserCreatedIssueRelationships now requires an
  apiVersion string in args
- exported function createUserReportedIssueRelationships now requires an
  apiVersion string in args

### Changed

- fix user ingestion for jira software on-prem

### Added

- add docs
- expand test coverage for jira software on-prem

## 2.3.5 - 2022-04-27

### Changed

- doc updates
- run/enforce prettier
- pr template
- CODEOWNERS

## 2.3.4 - 2022-04-08

### Added

- Updated to SDK verison 8.10.1 with a smaller max upload size.

## 2.3.3 - 2022-03-29

### Added

- Updated to SDK verison 8.8.0 with new logic for actively shrinking rawData
  when needed due to upload size constraints.
- Added back in `_rawData` to `jira_issue` entity.

## 2.3.2

### Removed

- removed `_rawData` from `jira_issue` entity.

## 2.3.1

### Fixed

- peer dependency for sdk

## 2.3.0

### Added

- publish logging event when all issues for a project are not ingested
- publish logging event when in bulk ingest mode
- upgrade to newest version of sdk

## 2.2.1

### Fixed

- Fixed ability to create Jira issues from the managed runtime environment.

## 2.2.0

### Added

- Added support for Jira API Version 2 (Jira Data Center 8.20.3)
- Added support for specifying the port in the `jiraHost` configuration value
  (i.e. `example.com:8080`)
- Added optional bulk ingestion feature to allow for collecting every single
  Issue in a Jira project. This is activated by setting
  `config.bulkIngestIssues: true`.
- Added `Issue` class to `jira_issue` entities
- Added error handling for Issue ingestion to avoid one bad Issue causing the
  step to fail
- Added retry functionality that respects Jira `Retry-After` header

### Changed

- Process issues and users per page instead of fetching all before processing

### Fixed

- Fix bug limiting per-project issue ingestion to 500 issues
- Fix bug limiting issues page size to 50

## [2.1.3] - 2021-08-17

### Removed

- Removed default `jira_user.email` property of `donotemail@example.com`

## [2.1.2] - 2021-08-12

### Added

- an `IntegrationProviderAuthorizationError` will be thrown on 403 responses to
  the `getUsers` endpoint.

## [2.1.1] - 2021-08-12

### Fixed

- Do not throw an error when a issue creator or reporter user is no longer in
  this Jira instance.

## [2.1.0] - 2021-08-12

### Fixed

- Only ingest `issues` from projects specified in the integration config.

## [2.0.0] - 2021-08-11

### Changed

- Rewrite on new SDK.
- Loosened the hostname validating regex to allow example.atlassian.net/jira

## [1.11.4] - 2021-07-027

### Changed

- Loosened the hostname validating regex to allow example.atlassian.net/jira

## [1.11.0] - 2021-06-04

- Add the functionality to create an issue with a specific class.

## [1.10.0] - 2021-05-21

### Added

- Ingestion for all Jira custom field types.

### Changed

- Validate `projects` config variable in `invocationValidation` and expose
  better errors.

## [1.9.8](https://github.com/github.com/JuptiterOne/graph-jira/compare/v1.9.7...v1.9.8) - 2020-09-18

### Changed

- Validate `projects` config variable in `invocationValidation` and expose
  better errors.
