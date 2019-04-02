import { EntityFromIntegration } from "@jupiterone/jupiter-managed-integration-sdk";

export const ACCOUNT_ENTITY_TYPE = "jira_account";
export const ACCOUNT_ENTITY_CLASS = "Account";

export interface AccountEntity extends EntityFromIntegration {
  baseUrl: string;
  version: string;
  buildNumber: number;
  buildDate: string;
  scmInfo: string;
  serverTitle: string;
}
