import {
  IntegrationExecutionContext,
  IntegrationInvocationEvent,
} from "@jupiterone/jupiter-managed-integration-sdk";

import { createJiraClient } from "./jira";
import { JiraIntegrationContext, ProjectConfig } from "./types";

export default async function initializeContext(
  context: IntegrationExecutionContext<IntegrationInvocationEvent>,
): Promise<JiraIntegrationContext> {
  const jira = createJiraClient(context);
  const projects = buildProjectConfigs(context.instance.config.projects);
  const { persister, graph, jobs } = context.clients.getClients();
  const lastJob = await jobs.getLastCompleted();
  const lastJobTimestamp = lastJob && lastJob.createDate;

  return {
    ...context,
    graph,
    persister,
    jira,
    projects,
    lastJobTimestamp,
  };
}

function buildProjectConfigs(projects: any): ProjectConfig[] {
  const projectConfigs: ProjectConfig[] = [];

  if (Array.isArray(projects)) {
    for (const v of projects) {
      if (isProjectKey(v)) {
        projectConfigs.push(buildProjectConfigWithKey(v));
      } else if (isProjectConfig(v)) {
        projectConfigs.push(v);
      }
    }
  } else if (isProjectKey(projects)) {
    projectConfigs.push(buildProjectConfigWithKey(projects));
  }

  return projectConfigs;
}

function buildProjectConfigWithKey(key: string): ProjectConfig {
  return { key };
}

function isProjectKey(v: any): boolean {
  return typeof v === "string" && v.trim() !== "";
}

function isProjectConfig(v: any): boolean {
  return v && isProjectKey(v.key);
}
