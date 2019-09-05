import {
  IntegrationActionName,
  IntegrationCreateEntityAction,
  IntegrationExecutionContext,
  IntegrationExecutionResult,
  summarizePersisterOperationsResults,
} from "@jupiterone/jupiter-managed-integration-sdk";

import {
  createIssueEntities,
  createProjectIssueRelationships,
  createUserCreatedIssueRelationships,
  createUserReportedIssueRelationships,
} from "./converters";
import initializeContext from "./initializeContext";
import createJiraIssue from "./jira/createJiraIssue";
import { JiraIntegrationContext } from "./types";

type ActionFunction = (
  context: JiraIntegrationContext,
) => Promise<IntegrationExecutionResult>;

interface ActionMap {
  [actionName: string]: ActionFunction | undefined;
}

const ACTIONS: ActionMap = {
  [IntegrationActionName.CREATE_ENTITY]: createIssue,
};

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

async function createIssue(
  context: JiraIntegrationContext,
): Promise<IntegrationExecutionResult> {
  const {
    jira,
    persister,
    event: { action },
  } = context;

  const issue = await createJiraIssue(
    jira,
    action as IntegrationCreateEntityAction,
  );
  const issues = issue ? [issue] : [];
  const issueEntities = createIssueEntities(issues);

  const entityOperations = persister.processEntities([], issueEntities);
  const relationshipOperations = persister.processRelationships(
    [],
    [
      ...createProjectIssueRelationships(issues),
      ...createUserCreatedIssueRelationships(issues),
      ...createUserReportedIssueRelationships(issues),
    ],
  );

  return {
    operations: summarizePersisterOperationsResults(
      await persister.publishPersisterOperations([
        entityOperations,
        relationshipOperations,
      ]),
    ),
    actionResult: {
      name: IntegrationActionName.INGEST,
      entities: issues,
    },
  };
}
