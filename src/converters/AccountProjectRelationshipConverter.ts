import {
  ACCOUNT_ENTITY_TYPE,
  ACCOUNT_PROJECT_RELATIONSHIP_CLASS,
  ACCOUNT_PROJECT_RELATIONSHIP_TYPE,
  AccountProjectRelationship,
  PROJECT_ENTITY_TYPE,
} from "../entities";
import { Project, ServerInfo } from "../jira";
import generateEntityKey from "../utils/generateEntityKey";

export function createAccountProjectRelationships(
  serverInfo: ServerInfo,
  projects: Project[],
) {
  const accountKey = generateEntityKey(ACCOUNT_ENTITY_TYPE, serverInfo.baseUrl);
  return projects.reduce((acc: AccountProjectRelationship[], project) => {
    return [...acc, createAccountProjectRelationship(accountKey, project)];
  }, []);
}

export function createAccountProjectRelationship(
  accountKey: string,
  project: Project,
): AccountProjectRelationship {
  const childKey = generateEntityKey(PROJECT_ENTITY_TYPE, project.id);

  return {
    _class: ACCOUNT_PROJECT_RELATIONSHIP_CLASS,
    _type: ACCOUNT_PROJECT_RELATIONSHIP_TYPE,
    _fromEntityKey: accountKey,
    _key: `${accountKey}_has_${childKey}`,
    _toEntityKey: childKey,
  };
}
