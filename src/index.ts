import { IntegrationInvocationConfig } from '@jupiterone/integration-sdk-core';

import {
  instanceConfigFields,
  IntegrationConfig,
  validateInvocation,
} from './config';
import { integrationSteps } from './steps';

export const invocationConfig: IntegrationInvocationConfig<IntegrationConfig> =
  {
    instanceConfigFields,
    validateInvocation,
    integrationSteps,
  };

//
// Changes to the types and functions below must be tested with
// `@jupiterone/jupiter-integration-jira`! This is a transitional design, not a
// recommended pattern for other integrations.
//
export {
  JiraClient,
  CreateIssueActionProperties,
  createJiraIssue,
} from './jira';
export {
  JiraIntegrationInstanceConfig,
  IntegrationConfig,
  normalizeInstanceConfig,
} from './config';

export {
  createIssueEntity,
  createProjectIssueRelationships,
  createUserCreatedIssueRelationships,
  createUserReportedIssueRelationships,
} from './converters';
