import JiraApi, { JiraApiOptions } from 'jira-client';

import { IntegrationLogger } from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from '../config';
import { JiraApiVersion } from './';
import { JiraClient } from './JiraClient';

export async function createJiraClient(
  logger: IntegrationLogger,
  config: IntegrationConfig,
): Promise<JiraClient> {
  let apiOptions: JiraApiOptions;

  if (config.jiraApiVersion) {
    apiOptions = buildJiraApiOptions(config, config.jiraApiVersion);
  } else {
    const apiVersion = await determineApiVersion(logger, config);
    apiOptions = buildJiraApiOptions(config, apiVersion);
  }

  return new JiraClient(logger, new JiraApi(apiOptions));
}

function buildJiraApiOptions(
  config: IntegrationConfig,
  version: JiraApiVersion,
): JiraApiOptions {
  return {
    protocol: config.hostProtocol,
    host: config.hostName,
    port: String(config.hostPort),
    base: config.urlBase,
    username: config.jiraUsername,
    password: config.jiraPassword,
    apiVersion: version,
    strictSSL: true,
  };
}

function determineApiVersion(
  logger: IntegrationLogger,
  config: IntegrationConfig,
): Promise<JiraApiVersion> {
  // TODO: getServerInfo?
  return Promise.resolve(config.jiraApiVersion || '3');
}
