import { User } from "../jira";
import { USER_ENTITY_CLASS, USER_ENTITY_TYPE, UserEntity } from "../jupiterone";

import generateKey from "../utils/generateKey";

export function createUserEntities(data: User[]): UserEntity[] {
  return data.map(user => {
    const userEntity: UserEntity = {
      _key: generateKey(USER_ENTITY_TYPE, user.accountId),
      _type: USER_ENTITY_TYPE,
      _class: USER_ENTITY_CLASS,
      id: user.accountId,
      displayName: user.displayName,
      self: user.self,
      key: user.key,
      name: user.name,
      email: user.emailAddress,
      timeZone: user.timeZone,
      active: user.active,
    };

    return userEntity;
  });
}
