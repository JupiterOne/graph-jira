import {
  IntegrationError,
  IntegrationExecutionContext,
  IntegrationInstanceConfig,
  IntegrationInstanceConfigFieldMap,
  IntegrationProviderAPIError,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { APIClient } from './client';
import {
  buildJiraHostConfig,
  detectApiVersion,
  isValidJiraHost,
  JiraApiVersion,
  JiraClient,
  JiraClientConfig,
  JiraHostConfig,
} from './jira';
import { buildProjectConfigs } from './utils';

/**
 * A type describing the configuration fields required to execute the
 * integration for a specific account in the data provider.
 *
 * When executing the integration in a development environment, these values may
 * be provided in a `.env` file with environment variables. For example:
 *
 * - `CLIENT_ID=123` becomes `instance.config.clientId = '123'`
 * - `CLIENT_SECRET=abc` becomes `instance.config.clientSecret = 'abc'`
 *
 * Environment variables are NOT used when the integration is executing in a
 * managed environment. For example, in JupiterOne, users configure
 * `instance.config` in a UI.
 *
 */
export const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  jiraHost: {
    type: 'string',
    mask: false,
  },
  jiraApiVersion: {
    type: 'string',
    mask: false,
  },
  jiraUsername: {
    type: 'string',
    mask: false,
  },
  jiraPassword: {
    type: 'string',
    mask: true,
  },
  projects: {
    type: 'string',
    mask: false,
  },
  bulkIngestIssues: {
    type: 'boolean',
    mask: false,
  },
};

/**
 * Properties provided by the `IntegrationInstance.config`. Normally reflects the
 * same properties defined by `instanceConfigFields`. See note above.
 */
export interface JiraIntegrationInstanceConfig
  extends IntegrationInstanceConfig {
  /**
   * The Jira host name and optionally the port and root path. Valid values
   * include:
   *
   * - `"localhost"`
   * - `"localhost:8080"`
   * - `"localhost/urlBase"`
   * - `"http://example.com"`
   * - `"subdomain.example.com/urlBase"`
   * - `"https://subdomain.example.com:443/urlBase"`
   */
  jiraHost: string;

  /**
   * An optional configuration of the Jira server API version. The integration
   * will attempt to detect the version when this is not provided explicitly.
   */
  jiraApiVersion?: JiraApiVersion;

  jiraUsername: string;
  jiraPassword: string;

  /**
   * An array of Jira project keys to target for ingestion.
   */
  projects: string[] | string;

  /**
   * An optional array of Jira Custom Field identifiers, indicating which custom
   * fields to transfer to `Issue` entity properties. The entity property names
   * will be `camelCase(field.name)`.
   *
   * - `"customfield_Whatever"` - a fully qualified identifier
   * - `"32918"` - normalized to `"customfield_32918"`
   * - `"my Field Yo"`, `"My Field yo"`, `"myFieldYo"` - normalized to
   *   `"myFieldYo" and matched to `camelCase(field.name)`
   */
  customFields?: string[];

  /**
   * Enable bulk ingestion of all Jira issues in the specified projects.
   */
  bulkIngestIssues?: boolean;
}

/**
 * Properties normalized from the `IntegrationInstance.config` after validation.
 * This configuration is provided to execution steps.
 */
export type IntegrationConfig = JiraIntegrationInstanceConfig &
  JiraClientConfig;

export async function validateInvocation(
  context: IntegrationExecutionContext<JiraIntegrationInstanceConfig>,
) {
  const { config } = context.instance;

  if (!config.jiraHost || !config.jiraPassword || !config.jiraUsername) {
    throw new IntegrationValidationError(
      'Config requires all of {jiraHost, jiraUsername, jiraPassword}',
    );
  }

  if (!isValidJiraHost(config.jiraHost)) {
    throw new IntegrationValidationError(
      'jiraHost must be a valid hostname with optional port and base path. (ex: example.com, example.com:2913, example.com/base, http://subdomain.example.com)',
    );
  }

  const jiraHostConfig = buildJiraHostConfig(config.jiraHost);

  let jiraApiVersion = config.jiraApiVersion;
  if (!jiraApiVersion) {
    try {
      jiraApiVersion = await detectApiVersion(jiraHostConfig);
    } catch (err) {
      throw new IntegrationError({
        code: 'UNKNOWN_JIRA_API_VERSION',
        message: err.message,
        cause: err,
        fatal: true,
      });
    }
  }

  const normalizedConfig = buildNormalizedInstanceConfig(
    config,
    jiraHostConfig,
    jiraApiVersion,
  );

  const jiraClient = new JiraClient(context.logger, normalizedConfig);
  const apiClient = new APIClient(context.logger, jiraClient);

  await apiClient.verifyAuthentication();

  // TODO: Remove buildProjectConfigs and simplify everything that calls it
  await validateProjectConfiguration(
    jiraClient,
    buildProjectConfigs(normalizedConfig.projects).map((e) => e.key),
  );

  context.instance.config = normalizedConfig;
}

export function buildNormalizedInstanceConfig(
  config: JiraIntegrationInstanceConfig,
  jiraHostConfig: JiraHostConfig,
  jiraApiVersion: JiraApiVersion,
): IntegrationConfig {
  return {
    ...config,
    ...jiraHostConfig,
    username: config.jiraUsername,
    password: config.jiraPassword,
    apiVersion: jiraApiVersion,
  };
}

export async function validateProjectConfiguration(
  client: JiraClient,
  projects: string[],
): Promise<void> {
  let fetchedProjectKeys: string[];
  try {
    const fetchedProjects = await client.fetchProjects();
    fetchedProjectKeys = fetchedProjects.map((p) => p.key);
  } catch (err) {
    throw new IntegrationProviderAPIError({
      endpoint: 'fetchProjects',
      status: err.statusCode,
      statusText: err.name,
      cause: err,
    });
  }

  const configProjectKeys = buildProjectConfigs(projects).map((p) => p.key);

  const invalidConfigProjectKeys = configProjectKeys.filter(
    (k) => !fetchedProjectKeys.includes(k),
  );

  if (invalidConfigProjectKeys.length) {
    throw new IntegrationValidationError(
      `The following project key(s) are invalid: ${JSON.stringify(
        invalidConfigProjectKeys,
      )}. Ensure the authenticated user has access to this project.`,
    );
  }
}
