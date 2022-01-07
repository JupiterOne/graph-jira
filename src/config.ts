import {
  IntegrationExecutionContext,
  IntegrationInstanceConfig,
  IntegrationInstanceConfigFieldMap,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { APIClient } from './client';
import { JiraApiVersion } from './jira';

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
  jiraProtocol: {
    type: 'string',
    mask: false,
  },
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
   * - `"example.com"`
   * - `"subdomain.example.com/urlBase"`
   *
   * @see jiraProtocol
   */
  jiraHost: string;

  /**
   * An optional configuration of the Jira server host HTTP connection protocol.
   * Defaults to `'https'`.
   *
   * @see jiraHost
   */
  jiraProtocol?: string;

  /**
   * An optional configuration of the Jira server API version. The integration
   * will attempt to detect the version.
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
export type IntegrationConfig = JiraIntegrationInstanceConfig & {
  hostProtocol: 'http' | 'https';
  hostName: string;
  hostPort: number;
  urlBase: string | undefined;
};

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
      'jiraHost must be a valid hostname with optional port and root path. (ex: example.com, example.com:2913, example.com/urlBase, subdomain.example.com)',
    );
  }

  const normalizedConfig = buildNormalizedInstanceConfig(config);
  const apiClient = new APIClient(context.logger, normalizedConfig);
  await apiClient.verifyAuthentication();

  context.instance.config = normalizedConfig;
}

const JIRA_HOST_REGEX =
  /^((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9]))(:(\d{1,4}))?(\/([A-Za-z0-9]+))?$/;

export function isValidJiraHost(jiraHost: string | undefined): boolean {
  return !!jiraHost && JIRA_HOST_REGEX.test(jiraHost);
}

export function buildNormalizedInstanceConfig(
  config: JiraIntegrationInstanceConfig,
): IntegrationConfig {
  const match = config.jiraHost.match(JIRA_HOST_REGEX);
  if (match) {
    return {
      ...config,
      hostProtocol: (config.jiraProtocol as 'http' | 'https') || 'https',
      hostName: match[1],
      hostPort: Number(match[6]) || 443,
      urlBase: match[8],
    };
  } else {
    throw new IntegrationValidationError(
      `Invalid jiraHost value, could not calculate configuration: ${JSON.stringify(
        config.jiraHost,
      )}`,
    );
  }
}
