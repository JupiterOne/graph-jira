import { ServerInfo } from "../jira";
import {
  ACCOUNT_ENTITY_CLASS,
  ACCOUNT_ENTITY_TYPE,
  AccountEntity,
} from "../jupiterone";

import generateKey from "../utils/generateKey";

export function createAccountEntity(serverInfo: ServerInfo): AccountEntity {
  return {
    _class: ACCOUNT_ENTITY_CLASS,
    _key: generateKey(ACCOUNT_ENTITY_TYPE, serverInfo.baseUrl),
    _type: ACCOUNT_ENTITY_TYPE,
    displayName: serverInfo.serverTitle,
    baseUrl: serverInfo.baseUrl,
    version: serverInfo.version,
    buildNumber: serverInfo.buildNumber,
    buildDate: serverInfo.buildDate,
    scmInfo: serverInfo.scmInfo,
    serverTitle: serverInfo.serverTitle,
  };
}
