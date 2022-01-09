import * as dotenv from 'dotenv';
import * as path from 'path';

import {
  IntegrationConfig,
  JiraIntegrationInstanceConfig,
} from '../src/config';

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
};

export const normalizedInstanceConfig: IntegrationConfig = {
  ...integrationInstanceConfig,
  username: integrationInstanceConfig.jiraUsername,
  password: integrationInstanceConfig.jiraPassword,
  protocol: 'https',
  host: integrationInstanceConfig.jiraHost,
  port: '443',
  apiVersion: '3',
  base: undefined,
};

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
  jiraHost: 'http://localhost:8080',
  jiraUsername: 'jupiterone-dev',
  jiraPassword: 'tA_WFXarmbnhh6Xkfrx',
  projects: ['SP'],
};

/**
 * A complete instance configuration for a local Jira server. This object can be
 * used in tests of components that expect a complete, normalized configuration.
 *
 * @see localServerInstanceConfig
 */
export const normalizedLocalServerInstanceConfig: IntegrationConfig = {
  ...localServerInstanceConfig,
  username: localServerInstanceConfig.jiraUsername,
  password: localServerInstanceConfig.jiraPassword,
  protocol: 'http',
  host: 'localhost',
  port: '8080',
  apiVersion: '2',
  base: undefined,
};
