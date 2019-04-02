import { RelationshipFromIntegration } from "@jupiterone/jupiter-managed-integration-sdk";

export interface AccountProjectRelationship
  extends RelationshipFromIntegration {
  id?: string;
}

export const ACCOUNT_PROJECT_RELATIONSHIP_TYPE = "jira_account_has_project";
export const ACCOUNT_PROJECT_RELATIONSHIP_CLASS = "HAS";
