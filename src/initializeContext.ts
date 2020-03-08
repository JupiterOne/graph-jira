import camelCase from "lodash/camelCase";

import { IntegrationExecutionContext } from "@jupiterone/jupiter-managed-integration-sdk";

import { createJiraClient } from "./jira";
import { JiraIntegrationContext, ProjectConfig } from "./types";
import getLastSyncTime from "./utils/getLastSyncTime";

export default async function initializeContext(
  context: IntegrationExecutionContext,
): Promise<JiraIntegrationContext> {
  const jira = createJiraClient(context.instance.config);
  const projects = buildProjectConfigs(context.instance.config.projects);
  const customFieldsToInclude = buildCustomFields(
    context.instance.config.customFields,
  );
  const { persister, graph } = context.clients.getClients();
  context.logger.debug(
    { integrationInstance: context.instance },
    "Fetching lastJobTimestamp",
  );
  const msInOneYear = 86400000 * 365;
  const lastJobTimestamp =
    (await getLastSyncTime(context)) || new Date().getTime() - msInOneYear;
  context.logger.info(
    { lastJobTimestamp },
    `Fetched lastJobTimestamp (${new Date(lastJobTimestamp).toString()})`,
  );

  return {
    ...context,
    graph,
    persister,
    jira,
    projects,
    customFieldsToInclude,
    lastJobTimestamp,
  };
}

function buildCustomFields(fields: any): string[] {
  const customFields: string[] = [];
  if (fields) {
    for (const f of Array.isArray(fields) ? fields : [fields]) {
      if (f.startsWith("customfield_")) {
        customFields.push(f);
      } else if (f.match(/\d{5}/)) {
        customFields.push(`customfield_${f}`);
      } else {
        customFields.push(camelCase(f));
      }
    }
  }
  return customFields;
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
