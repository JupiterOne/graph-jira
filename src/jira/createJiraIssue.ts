import { IntegrationCreateEntityAction } from "../tempEventTypes";
import JiraClient from "./JiraClient";
import { Issue, JiraDataModel, Project, ServerInfo } from "./types";

export default async function createJiraIssue(
  client: JiraClient,
  action: IntegrationCreateEntityAction,
): Promise<JiraDataModel> {
  // @ts-ignore
  const { summary, classification, project } = action.properties;

  const newIssue = await client.addNewIssue(
    summary,
    Number(project),
    classification,
  );
  const issueFullData: Issue = (await client.findIssue(newIssue.key)) as Issue;
  const issues = ([] as Issue[]).concat(issueFullData);

  return {
    projects: [] as Project[],
    serverInfo: {} as ServerInfo,
    users: [],
    issues,
  };
}
