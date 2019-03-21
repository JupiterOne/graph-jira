import {
  IntegrationExecutionContext,
  IntegrationInvocationEvent,
} from "@jupiterone/jupiter-managed-integration-sdk";

import { createJiraClient } from "./jira";

export default async function initializeContext(
  context: IntegrationExecutionContext<IntegrationInvocationEvent>,
) {
  const provider = createJiraClient(context);
  await provider.authenticate();

  const { persister, graph } = context.clients.getClients();

  return {
    graph,
    persister,
    provider,
    projects: context.instance.config.projects,
  };
}
