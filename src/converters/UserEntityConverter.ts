import { USER_ENTITY_CLASS, USER_ENTITY_TYPE, UserEntity } from '../entities';
import { User, UserV2, UserV3 } from '../jira';
import { generateEntityKey } from '../utils';

export function createUserEntity(user: User, apiVersion: string): UserEntity {
  if (apiVersion === '3') {
    const castedUser = user as UserV3;
    return {
      _key: generateEntityKey(USER_ENTITY_TYPE, castedUser.accountId),
      _type: USER_ENTITY_TYPE,
      _class: USER_ENTITY_CLASS,
      _rawData: [{ name: 'default', rawData: castedUser }],
      id: castedUser.accountId,
      displayName: castedUser.displayName,
      self: castedUser.self,
      name: castedUser.name || castedUser.displayName,
      email: castedUser.emailAddress,
      timeZone: castedUser.timeZone,
      active: castedUser.active,
      accountType: castedUser.accountType,
      username: castedUser.emailAddress || castedUser.displayName, //some system users in Jira don't have emails
      webLink: `https://${castedUser.self.split('/')[2]}/jira/people/${
        castedUser.accountId
      }`,
    };
  } else if (apiVersion === '2') {
    const castedUser = user as UserV2;
    return {
      _key: castedUser.key,
      _type: USER_ENTITY_TYPE,
      _class: USER_ENTITY_CLASS,
      _rawData: [{ name: 'default', rawData: castedUser }],
      id: castedUser.key,
      displayName: castedUser.displayName,
      self: castedUser.self,
      name: castedUser.name || castedUser.displayName,
      email: castedUser.emailAddress,
      timeZone: castedUser.timeZone,
      active: castedUser.active,
      deleted: castedUser.deleted,
      username: castedUser.emailAddress || castedUser.displayName, //some system users in Jira don't have emails
      webLink: `https://${castedUser.self.split('/')[2]}/jira/people/${
        castedUser.key
      }`,
    };
  } else {
    throw new Error(`Unknown Jira API version: ${apiVersion}`);
  }
}
