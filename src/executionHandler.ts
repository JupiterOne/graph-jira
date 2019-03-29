import {
  IntegrationExecutionContext,
  IntegrationExecutionResult,
  IntegrationInvocationEvent,
  summarizePersisterOperationsResults,
} from "@jupiterone/jupiter-managed-integration-sdk";

import initializeContext from "./initializeContext";
import { JiraDataModel } from "./jira";
import createJiraIssue from "./jira/createJiraIssue";
import fetchJiraData from "./jira/fetchJiraData";
import JiraClient from "./jira/JiraClient";
import fetchEntitiesAndRelationships, {
  JupiterOneDataModel,
} from "./jupiterone/fetchEntitiesAndRelationships";
import publishChanges from "./persister/publishChanges";
import {
  IntegrationActionName,
  IntegrationCreateEntityAction,
} from "./tempEventTypes";

export default async function executionHandler(
  context: IntegrationExecutionContext<IntegrationInvocationEvent>,
): Promise<IntegrationExecutionResult> {
  const { graph, persister, provider, projects } = await initializeContext(
    context,
  );

  const oldData: JupiterOneDataModel = await fetchEntitiesAndRelationships(
    graph,
  );
  const jiraData: JiraDataModel = await handleEventAction(
    context,
    provider,
    projects,
  );

  return {
    operations: summarizePersisterOperationsResults(
      await publishChanges(persister, oldData, jiraData),
    ),
  };
}

export async function handleEventAction(
  context: IntegrationExecutionContext<IntegrationInvocationEvent>,
  provider: JiraClient,
  projects: any,
): Promise<JiraDataModel> {
  // @ts-ignore
  if (!context.event || !context.event.action || !context.event.action.name) {
    return await fetchJiraData(provider, projects);
  }
  // @ts-ignore
  switch (context.event.action.name) {
    case IntegrationActionName.CREATE_ENTITY:
      return await createJiraIssue(
        provider,
        // @ts-ignore
        context.event.action as IntegrationCreateEntityAction,
      );
    case IntegrationActionName.SCAN:
    case IntegrationActionName.INGEST:
    default:
      return await fetchJiraData(provider, projects);
  }
}
