import JiraApi from 'jira-client';

import { IntegrationLogger } from '@jupiterone/integration-sdk-core';

import { APIClient } from '../client';
import { IntegrationConfig } from '../config';
import { JiraClient } from '../jira/JiraClient';

export * from './builders';

export function generateEntityKey(type: string, id: string | number) {
  return `${type}_${id}`;
}

export function createApiClient(
  logger: IntegrationLogger,
  config: IntegrationConfig,
): APIClient {
  return new APIClient(logger, new JiraClient(logger, new JiraApi(config)));
}
