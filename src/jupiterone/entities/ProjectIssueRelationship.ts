import { RelationshipFromIntegration } from "@jupiterone/jupiter-managed-integration-sdk";

export interface ProjectIssueRelationship extends RelationshipFromIntegration {
  id?: string;
}

export const PROJECT_ISSUE_RELATIONSHIP_TYPE = "jira_project_has_issue";
export const PROJECT_ISSUE_RELATIONSHIP_CLASS = "HAS";
