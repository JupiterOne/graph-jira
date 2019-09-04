import { USER_ENTITY_CLASS, USER_ENTITY_TYPE, UserEntity } from "../entities";
import { User } from "../jira";

import generateEntityKey from "../utils/generateEntityKey";

export function createUserEntities(data: User[]): UserEntity[] {
  return data.map(user => {
    const userEntity: UserEntity = {
      _key: generateEntityKey(USER_ENTITY_TYPE, user.accountId),
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
