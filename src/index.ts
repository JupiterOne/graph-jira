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
