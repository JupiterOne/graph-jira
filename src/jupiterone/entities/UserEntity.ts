import { EntityFromIntegration } from "@jupiterone/jupiter-managed-integration-sdk";

export const USER_ENTITY_TYPE = "jira_user";
export const USER_ENTITY_CLASS = "User";

export interface UserEntity extends EntityFromIntegration {
  id: string;
  self: string;
  key: string;
  name: string;
  email: string;
  timeZone: string;
  active: boolean;
}
