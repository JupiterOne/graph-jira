import {
  IntegrationExecutionContext,
  IntegrationInstanceConfig,
  IntegrationInstanceConfigFieldMap,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from './client';

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
export interface IntegrationConfig extends IntegrationInstanceConfig {
  jiraHost: string;
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

export async function validateInvocation(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  const { config } = context.instance;

  if (!config.jiraHost || !config.jiraPassword || !config.jiraUsername) {
    throw new IntegrationValidationError(
      'config.jiraHost and config.jiraPassword and config.jiraUsername must be provided by the user',
    );
  }

  //this regex matches 'localhost', 'example.com', 'subdomain.example.com'
  //but cannot contain any chars other than letters, numbers, '-', '/' and '.'
  //the '/' cannot appear at the beginning or end of the string - it's meant to
  //represent the format 'test.com/jirasubdir'
  const hostnameRegex =
    /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9/][A-Za-z0-9-/]*[A-Za-z0-9])$/;
  if (!config.jiraHost.match(hostnameRegex)) {
    throw new IntegrationValidationError(
      'config.jiraHost must be a valid hostname. (ex: localhost, test.com, sub.test.com)',
    );
  }

  const apiClient = createAPIClient(config, context.logger);
  await apiClient.verifyAuthentication();
}
