import {
  GraphClient,
  IntegrationExecutionContext,
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
  additionalFields?: object;
}

export interface JiraIntegrationContext extends IntegrationExecutionContext {
  graph: GraphClient;
  persister: PersisterClient;
  jira: JiraClient;
  projects: ProjectConfig[];
  customFieldsToInclude: string[];
  lastJobTimestamp: number | null;
}

export interface ResourceCacheState {
  resourceFetchCompleted?: boolean;
}
