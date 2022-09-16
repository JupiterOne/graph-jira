import * as dotenv from 'dotenv';
import * as path from 'path';

import {
  buildNormalizedInstanceConfig,
  JiraIntegrationInstanceConfig,
} from '../src/config';
import { buildJiraHostConfig } from '../src/jira';

if (process.env.LOAD_ENV) {
  dotenv.config({
    path: path.join(__dirname, '../.env'),
  });
}

export const integrationInstanceConfig: JiraIntegrationInstanceConfig = {
  jiraHost: process.env.JIRA_HOST || 'jupiterone-dev.atlassian.net',
  jiraUsername: process.env.JIRA_USERNAME || 'development@jupiterone.dev',
  jiraPassword: process.env.JIRA_PASSWORD || 'default-jira-password',
  projects: process.env.PROJECTS || ['JJI'],
  redactIssueDescriptions: false,
};

export const normalizedInstanceConfig = buildNormalizedInstanceConfig(
  integrationInstanceConfig,
  buildJiraHostConfig(integrationInstanceConfig.jiraHost),
  '3',
);

/**
 * An instance configuration for a local Jira server. This object can be used in
 * tests of components that receive the basic, non-normalized user configuration.
 *
 * `docs/development.md` provides pointers for getting a local Jira server
 * running on your machine.
 *
 * @see normalizedLocalServerInstanceConfig
 */
export const localServerInstanceConfig: JiraIntegrationInstanceConfig = {
  jiraHost: process.env.LOCAL_SERVER_JIRA_HOST || 'http://localhost:8080',
  jiraUsername: process.env.LOCAL_SERVER_JIRA_USERNAME || 'jupiterone-dev',
  jiraPassword:
    process.env.LOCAL_SERVER_JIRA_PASSWORD || 'default-jira-password',
  projects: process.env.LOCAL_SERVER_PROJECTS || ['SP'],
  redactIssueDescriptions: false,
};

/**
 * A complete instance configuration for a local Jira server. This object can be
 * used in tests of components that expect a complete, normalized configuration.
 *
 * @see localServerInstanceConfig
 */
export const normalizedLocalServerInstanceConfig =
  buildNormalizedInstanceConfig(
    localServerInstanceConfig,
    buildJiraHostConfig(localServerInstanceConfig.jiraHost),
    '2',
  );
