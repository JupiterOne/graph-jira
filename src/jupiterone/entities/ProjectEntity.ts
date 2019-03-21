import { EntityFromIntegration } from "@jupiterone/jupiter-managed-integration-sdk";

export const PROJECT_ENTITY_TYPE = "jira_project";
export const PROJECT_ENTITY_CLASS = "Project";

export interface ProjectEntity extends EntityFromIntegration {
  id: string
  self: string
  key: string
  name: string
  projectTypeKey: string
  simplified: boolean
  style: string
  isPrivate: boolean
}
