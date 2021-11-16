import { IntegrationLogger } from '@jupiterone/integration-sdk-core';
import JiraClient from './JiraClient';

export default function createJiraClient(
  config: any,
  logger: IntegrationLogger,
) {
  return new JiraClient(
    {
      host: config.jiraHost,
      username: config.jiraUsername,
      password: config.jiraPassword,
    },
    logger,
  );
}
