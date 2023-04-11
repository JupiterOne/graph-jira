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
  isJiraHostString,
  JiraApiVersion,
  JiraClient,
  JiraClientConfig,
  JiraHostConfig,
} from './jira';
import { normalizeCustomFieldIdentifiers, normalizeProjectKeys } from './utils';

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
  jiraPATToken: {
    type: 'string',
    mask: true,
  },
  redactIssueDescriptions: {
    type: 'boolean',
    mask: false,
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
   * An unvalidated `JiraHostString`.
   */
  jiraHost: string;

  /**
   * An optional configuration of the Jira server API version. The integration
   * will attempt to detect the version when this is not provided explicitly.
   */
  jiraApiVersion?: JiraApiVersion;

  jiraUsername: string;
  jiraPassword: string;
  jiraPATToken: string;

  /**
   * An array of Jira project keys to target for ingestion.
   */
  projects: string[] | string;

  /**
   * Defaults to false. Set to true if you would like issue descriptions to be redacted in jira_issue entities.
   */
  redactIssueDescriptions: boolean;

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
  JiraClientConfig & {
    projects: string[];
    customFields: string[];
  };

/**
 * Validates the integration configuration. The `context.instance.config` will
 * be assigned an object containing validated values.
 *
 * TODO: Adopt SDK 8.2.0 to use `loadExecutionConfig` insteaad of mutating in
 * this validation function. See https://github.com/JupiterOne/sdk/pull/587.
 */
export async function validateInvocation(
  context: IntegrationExecutionContext<JiraIntegrationInstanceConfig>,
) {
  const { config } = context.instance;

  if (!config.jiraHost) {
    throw new IntegrationValidationError('Config requires {jiraHost}');
  }

  if (!(config.jiraPassword && config.jiraUsername) && !config.jiraPATToken) {
    throw new IntegrationValidationError(
      'Config requires either {jiraUsername, jiraPassword} or {jiraPATToken}',
    );
  }

  if (!isJiraHostString(config.jiraHost)) {
    throw new IntegrationValidationError(
      'jiraHost must be a valid Jira host string (ex: example.com, example.com:2913, example.com/base, http://subdomain.example.com)',
    );
  }

  const normalizedConfig = await normalizeInstanceConfig(config);
  const jiraClient = new JiraClient(context.logger, normalizedConfig);
  const apiClient = new APIClient(context.logger, jiraClient);

  await apiClient.verifyAuthentication();

  await validateProjectKeys(jiraClient, normalizedConfig.projects);

  context.instance.config = normalizedConfig;
}

/**
 * Produces an `IntegrationConfig`, detecting the server API version when one is
 * not provided.
 *
 * @throws IntegrationError when the API version cannot be determined.
 */
export async function normalizeInstanceConfig(
  config: JiraIntegrationInstanceConfig,
): Promise<IntegrationConfig> {
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

  return buildNormalizedInstanceConfig(config, jiraHostConfig, jiraApiVersion);
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
    bearer: config.jiraPATToken,
    apiVersion: jiraApiVersion,
    projects: normalizeProjectKeys(config.projects),
    customFields: normalizeCustomFieldIdentifiers(config.customFields),
  };
}

export async function validateProjectKeys(
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

  const invalidConfigProjectKeys = projects.filter(
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
