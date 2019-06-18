import {
  IntegrationActionName,
  IntegrationCreateEntityAction,
  IntegrationExecutionContext,
  IntegrationExecutionResult,
  summarizePersisterOperationsResults,
} from "@jupiterone/jupiter-managed-integration-sdk";
import initializeContext from "./initializeContext";
import createJiraIssue from "./jira/createJiraIssue";
import fetchJiraData from "./jira/fetchJiraData";
import fetchEntitiesAndRelationships, {
  JupiterOneDataModel,
} from "./jupiterone/fetchEntitiesAndRelationships";
import publishChanges from "./persister/publishChanges";
import { JiraIntegrationContext } from "./types";

export default async function executionHandler(
  context: IntegrationExecutionContext,
): Promise<IntegrationExecutionResult> {
  const actionFunction = ACTIONS[context.event.action.name];
  if (actionFunction) {
    return await actionFunction(await initializeContext(context));
  } else {
    return {};
  }
}

async function synchronize(
  context: JiraIntegrationContext,
): Promise<IntegrationExecutionResult> {
  const { jira, graph, persister, projects, lastJobTimestamp } = context;

  const graphData: JupiterOneDataModel = await fetchEntitiesAndRelationships(
    graph,
  );

  const jiraData = await fetchJiraData(jira, projects, lastJobTimestamp);

  return {
    operations: summarizePersisterOperationsResults(
      await publishChanges(persister, graphData, jiraData),
    ),
  };
}

async function createIssue(
  context: JiraIntegrationContext,
): Promise<IntegrationExecutionResult> {
  const {
    jira,
    persister,
    event: { action },
  } = context;

  const { data: jiraData, issue } = await createJiraIssue(
    jira,
    action as IntegrationCreateEntityAction,
  );

  const emptyOldData: JupiterOneDataModel = {
    entities: { issues: [], users: [], projects: [], accounts: [] },
    relationships: {
      userCreatedIssueRelationships: [],
      userReportedIssueRelationships: [],
      projectIssueRelationships: [],
      accountProjectRelationships: [],
    },
  };

  return {
    operations: summarizePersisterOperationsResults(
      await publishChanges(persister, emptyOldData, jiraData),
    ),
    actionResult: {
      name: IntegrationActionName.INGEST,
      entities: [issue],
    },
  };
}

type ActionFunction = (
  context: JiraIntegrationContext,
) => Promise<IntegrationExecutionResult>;

interface ActionMap {
  [actionName: string]: ActionFunction | undefined;
}

const ACTIONS: ActionMap = {
  [IntegrationActionName.INGEST]: synchronize,
  [IntegrationActionName.CREATE_ENTITY]: createIssue,
};
