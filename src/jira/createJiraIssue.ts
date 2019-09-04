import { IntegrationCreateEntityAction } from "@jupiterone/jupiter-managed-integration-sdk";

import { CreateIssueActionProperties } from "../types";
import JiraClient from "./JiraClient";
import { Issue } from "./types";

export default async function createJiraIssue(
  client: JiraClient,
  action: IntegrationCreateEntityAction,
): Promise<Issue> {
  const {
    summary,
    classification,
    project,
    additionalFields,
  } = action.properties as CreateIssueActionProperties;

  // TODO resolve project id using project key??
  // TODO how is classification supposed to map to issue type??
  const newIssue = await client.addNewIssue(
    summary,
    Number(project),
    classification as any,
    additionalFields,
  );

  return client.findIssue(newIssue.key);
}
