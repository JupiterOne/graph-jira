import {
  GraphClient,
  IntegrationExecutionContext,
  IntegrationInvocationEvent,
  PersisterClient,
} from "@jupiterone/jupiter-managed-integration-sdk";
import JiraClient from "./jira/JiraClient";

export interface ProjectConfig {
  key: string;
}

export interface CreateIssueActionProperties {
  /**
   * The key of the issue project.
   */
  project: string;
  summary: string;
  classification: string;
}

export interface JiraIntegrationContext
  extends IntegrationExecutionContext<IntegrationInvocationEvent> {
  graph: GraphClient;
  persister: PersisterClient;
  jira: JiraClient;
  projects: ProjectConfig[];
}
