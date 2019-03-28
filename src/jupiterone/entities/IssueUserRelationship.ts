import { RelationshipFromIntegration } from "@jupiterone/jupiter-managed-integration-sdk";

export interface IssueCreatedByUserRelationship
  extends RelationshipFromIntegration {
  id?: string;
}

export const ISSUE_CREATED_BY_USER_RELATIONSHIP_TYPE =
  "jira_issue_created_by_user";
export const ISSUE_CREATED_BY_USER_RELATIONSHIP_CLASS = "CREATED_BY";

export interface IssueReportedByUserRelationship
  extends RelationshipFromIntegration {
  id?: string;
}

export const ISSUE_REPORTED_BY_USER_RELATIONSHIP_TYPE =
  "jira_issue_reported_by_user";
export const ISSUE_REPORTED_BY_USER_RELATIONSHIP_CLASS = "REPORTED_BY";
