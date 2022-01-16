import { JiraProjectId } from './';
import { JiraClient } from './JiraClient';
import { CreateIssueActionProperties, Issue } from './types';

async function getProjectIdForProjectKey(
  client: JiraClient,
  project: string,
): Promise<JiraProjectId> {
  const projectId = Number(project);

  if (!isNaN(projectId)) {
    if (project.includes('.')) {
      throw new Error(`Invalid project id provided (projectId=${project})`);
    }

    if (!Number.isInteger(projectId)) {
      throw new Error(`Invalid project id provided (projectId=${projectId})`);
    }

    return projectId;
  }

  return client.projectKeyToProjectId(project);
}

export async function createJiraIssue(
  client: JiraClient,
  action: { properties: CreateIssueActionProperties; [k: string]: any },
): Promise<Issue> {
  const {
    summary,
    classification: issueTypeName,
    project,
    additionalFields,
  } = action.properties;

  const projectId = await getProjectIdForProjectKey(client, project);
  const newIssue = await client.addNewIssue({
    summary,
    projectId,
    issueTypeName,
    additionalFields,
  });

  return client.findIssue(newIssue.key);
}
