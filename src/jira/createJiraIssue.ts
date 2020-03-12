import { IntegrationCreateEntityAction } from "@jupiterone/jupiter-managed-integration-sdk";

import { CreateIssueActionProperties } from "../types";
import JiraClient from "./JiraClient";
import { Issue } from "./types";

async function getProjectIdFromProvidedProject(
  client: JiraClient,
  project: string,
): Promise<number> {
  const projectId = Number(project);

  if (!isNaN(projectId)) {
    if (project.includes(".")) {
      throw new Error(`Invalid project id provided (projectId=${project})`);
    }

    if (!Number.isInteger(projectId)) {
      throw new Error(`Invalid project id provided (projectId=${projectId})`);
    }

    return projectId;
  }

  return client.projectKeyToProjectId(project);
}

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

  const projectId = await getProjectIdFromProvidedProject(client, project);
  const newIssue = await client.addNewIssue(
    summary,
    projectId,
    classification as any,
    additionalFields,
  );

  return client.findIssue(newIssue.key);
}
