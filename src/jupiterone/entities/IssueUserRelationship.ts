import { RelationshipFromIntegration } from "@jupiterone/jupiter-managed-integration-sdk";

export interface UserIssueRelationship extends RelationshipFromIntegration {
  id?: string;
}

export const USER_CREATED_ISSUE_RELATIONSHIP_TYPE = "jira_user_created_issue";
export const USER_CREATED_ISSUE_RELATIONSHIP_CLASS = "CREATED";

export const USER_REPORTED_ISSUE_RELATIONSHIP_TYPE = "jira_user_reported_issue";
export const USER_REPORTED_ISSUE_RELATIONSHIP_CLASS = "REPORTED";
