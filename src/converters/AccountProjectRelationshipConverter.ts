import { Project, ServerInfo } from "../jira";

import {
  ACCOUNT_ENTITY_TYPE,
  ACCOUNT_PROJECT_RELATIONSHIP_CLASS,
  ACCOUNT_PROJECT_RELATIONSHIP_TYPE,
  AccountProjectRelationship,
  PROJECT_ENTITY_TYPE,
} from "../jupiterone";

import generateKey from "../utils/generateKey";

export function createAccountProjectRelationships(
  serverInfo: ServerInfo,
  projects: Project[],
) {
  const defaultValue: AccountProjectRelationship[] = [];

  return projects.reduce((acc, group) => {
    const parentKey = generateKey(ACCOUNT_ENTITY_TYPE, serverInfo.baseUrl);
    const childKey = generateKey(PROJECT_ENTITY_TYPE, group.id);

    const relationship: AccountProjectRelationship = {
      _class: ACCOUNT_PROJECT_RELATIONSHIP_CLASS,
      _type: ACCOUNT_PROJECT_RELATIONSHIP_TYPE,
      _fromEntityKey: parentKey,
      _key: `${parentKey}_has_${childKey}`,
      _toEntityKey: childKey,
    };

    return [...acc, relationship];
  }, defaultValue);
}
