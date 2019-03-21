import { EntityFromIntegration } from "@jupiterone/jupiter-managed-integration-sdk";

export const ISSUE_ENTITY_TYPE = "jira_issue";
export const ISSUE_ENTITY_CLASS = "Issue";

export interface IssueEntity extends EntityFromIntegration {
  id: string;
  name: string;
  summary: string;
  category: string;
  webLink: string;
  status: string;
  reporter: string;
  assignee: string;
  creator: string;
}
