import {
  IntegrationInstanceAuthenticationError,
  IntegrationInstanceConfigError,
  IntegrationValidationContext,
} from "@jupiterone/jupiter-managed-integration-sdk";

import { buildProjectConfigs } from "./initializeContext";
import { createJiraClient } from "./jira";

/**
 * Performs validation of the execution before the execution handler function is
 * invoked.
 *
 * At a minimum, integrations should ensure that the
 * `context.instance.config` is valid. Integrations that require
 * additional information in `context.invocationArgs` should also
 * validate those properties. It is also helpful to perform authentication with
 * the provider to ensure that credentials are valid.
 *
 * The function will be awaited to support connecting to the provider for this
 * purpose.
 *
 * @param context
 */
export default async function invocationValidator(
  context: IntegrationValidationContext,
) {
  const {
    instance: { config },
  } = context;

  if (!config.jiraHost || !config.jiraPassword || !config.jiraUsername) {
    throw new IntegrationInstanceConfigError(
      "config.jiraHost and config.jiraPassword and config.jiraUsername must be provided by the user",
    );
  }

  const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9/][A-Za-z0-9-/]*[A-Za-z0-9])$/;
  if (!config.jiraHost.match(hostnameRegex)) {
    throw new IntegrationInstanceConfigError(
      "config.jiraHost must be a valid hostname",
    );
  }

  const provider = createJiraClient(config);

  let fetchedProjectKeys: string[];
  try {
    const fetchedProjects = await provider.fetchProjects();
    fetchedProjectKeys = fetchedProjects.map(p => p.key);
  } catch (err) {
    throw new IntegrationInstanceAuthenticationError(err);
  }

  const configProjectKeys = buildProjectConfigs(config.projects).map(
    p => p.key,
  );

  const invalidConfigProjectKeys = configProjectKeys.filter(
    k => !fetchedProjectKeys.includes(k),
  );
  if (invalidConfigProjectKeys.length) {
    throw new IntegrationInstanceConfigError(
      `The following project key(s) are invalid: ${JSON.stringify(
        invalidConfigProjectKeys,
      )}. Ensure the authenticated user has access to this project.`,
    );
  }
}
