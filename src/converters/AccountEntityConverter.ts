import { ServerInfo } from "../jira";
import {
  ACCOUNT_ENTITY_CLASS,
  ACCOUNT_ENTITY_TYPE,
  AccountEntity,
} from "../jupiterone";
import generateEntityKey from "../utils/generateEntityKey";
import getTime from "../utils/getTime";

export function createAccountEntity(serverInfo: ServerInfo): AccountEntity {
  return {
    _class: ACCOUNT_ENTITY_CLASS,
    _key: generateEntityKey(ACCOUNT_ENTITY_TYPE, serverInfo.baseUrl),
    _type: ACCOUNT_ENTITY_TYPE,
    displayName: serverInfo.serverTitle,
    baseUrl: serverInfo.baseUrl,
    version: serverInfo.version,
    buildNumber: serverInfo.buildNumber,
    buildDate: getTime(serverInfo.buildDate)!,
    scmInfo: serverInfo.scmInfo,
    serverTitle: serverInfo.serverTitle,
  };
}
