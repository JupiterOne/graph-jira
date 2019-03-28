import {
  IntegrationExecutionContext,
  IntegrationInstanceAuthenticationError,
  IntegrationInstanceConfigError,
  IntegrationInvocationEvent,
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
 * @param executionContext
 */
export default async function invocationValidator(
  executionContext: IntegrationExecutionContext<IntegrationInvocationEvent>,
) {
  const {
    instance: { config },
  } = executionContext;

  if (!config.host || !config.jiraPassword || !config.jiraLogin) {
    throw new IntegrationInstanceConfigError(
      "config.host and config.jiraPassword and config.jiraLogin must be provided by the user",
    );
  }

  const provider = createJiraClient(executionContext);
  try {
    await provider.fetchProjects();
  } catch (err) {
    throw new IntegrationInstanceAuthenticationError(err);
  }
}
