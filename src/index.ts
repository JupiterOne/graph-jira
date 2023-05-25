import { IntegrationInvocationConfig } from '@jupiterone/integration-sdk-core';

import {
  ingestionConfig,
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
    ingestionConfig,
  };

//
// Changes to the types and functions below must be tested with
// `@jupiterone/jupiter-integration-jira`! This is a transitional design, not a
// recommended pattern for other integrations.
//
export { CreateIssueActionProperties, createJiraIssue } from './actions';

export { JiraClient } from './jira';

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
