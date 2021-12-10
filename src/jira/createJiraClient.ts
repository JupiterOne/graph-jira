import { IntegrationLogger } from '@jupiterone/integration-sdk-core';
import JiraClient from './JiraClient';

export default function createJiraClient(
  config: {
    jiraHost: string;
    jiraUsername: string;
    jiraPassword: string;
  },
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
