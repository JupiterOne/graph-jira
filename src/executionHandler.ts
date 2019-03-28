import {
  IntegrationExecutionContext,
  IntegrationExecutionResult,
  IntegrationInvocationEvent,
  summarizePersisterOperationsResults,
} from "@jupiterone/jupiter-managed-integration-sdk";

import initializeContext from "./initializeContext";
import { JiraDataModel } from "./jira";
import fetchJiraData from "./jira/fetchJiraData";
import fetchEntitiesAndRelationships, {
  JupiterOneDataModel,
} from "./jupiterone/fetchEntitiesAndRelationships";
import publishChanges from "./persister/publishChanges";

export default async function executionHandler(
  context: IntegrationExecutionContext<IntegrationInvocationEvent>,
): Promise<IntegrationExecutionResult> {
  const { graph, persister, provider, projects } = await initializeContext(
    context,
  );

  const oldData: JupiterOneDataModel = await fetchEntitiesAndRelationships(
    graph,
  );
  const jiraData: JiraDataModel = await fetchJiraData(provider, projects);

  return {
    operations: summarizePersisterOperationsResults(
      await publishChanges(persister, oldData, jiraData),
    ),
  };
}
