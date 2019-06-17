import { IntegrationCreateEntityAction } from "@jupiterone/jupiter-managed-integration-sdk";

import { CreateIssueActionProperties } from "../types";
import JiraClient from "./JiraClient";
import { Issue, JiraDataModel, Project, ServerInfo } from "./types";

export default async function createJiraIssue(
  client: JiraClient,
  action: IntegrationCreateEntityAction,
): Promise<{ data: JiraDataModel; issue: Issue }> {
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
  const issueFullData: Issue = (await client.findIssue(newIssue.key)) as Issue;
  const issues = ([] as Issue[]).concat(issueFullData);

  return {
    data: {
      projects: [] as Project[],
      serverInfo: {} as ServerInfo,
      users: [],
      issues,
    },
    issue: issueFullData,
  };
}
