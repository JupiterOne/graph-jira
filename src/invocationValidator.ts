import {
  IntegrationInstanceAuthenticationError,
  IntegrationInstanceConfigError,
  IntegrationValidationContext,
} from "@jupiterone/jupiter-managed-integration-sdk";

import { createJiraClient } from "./jira";

/**
 * Performs validation of the execution before the execution handler function is
 * invoked.
 *
 * At a minimum, integrations should ensure that the instance configuration is
 * valid. It is also helpful to perform authentication with the provider to
 * ensure that credentials are valid. The function will be awaited to support
 * connecting to the provider for this purpose.
 *
 * @param validationContext
 */
export default async function invocationValidator(
  validationContext: IntegrationValidationContext,
) {
  const {
    instance: { config },
  } = validationContext;

  if (!config.jiraHost || !config.jiraPassword || !config.jiraUsername) {
    throw new IntegrationInstanceConfigError(
      "config.jiraHost and config.jiraPassword and config.jiraUsername must be provided by the user",
    );
  }

  const provider = createJiraClient(config);
  try {
    await provider.fetchProjects();
  } catch (err) {
    throw new IntegrationInstanceAuthenticationError(err);
  }
}
