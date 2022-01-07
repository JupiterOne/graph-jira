import {
  createDirectRelationship,
  IntegrationMissingKeyError,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { APIClient } from '../client';
import { IntegrationConfig } from '../config';
import { createUserEntity } from '../converters';
import {
  ACCOUNT_ENTITY_TYPE,
  ACCOUNT_USER_RELATIONSHIP_TYPE,
  AccountEntity,
  USER_ENTITY_CLASS,
  USER_ENTITY_TYPE,
  UserEntity,
} from '../entities';
import { DATA_ACCOUNT_ENTITY } from './account';

export async function fetchUsers({
  instance,
  logger,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const config = instance.config;
  const apiClient = new APIClient(logger, config);

  const accountEntity = await jobState.getData<AccountEntity>(
    DATA_ACCOUNT_ENTITY,
  );
  if (!accountEntity) {
    throw new IntegrationMissingKeyError(
      `Expected to find Account entity in jobState`,
    );
  }

  await apiClient.iterateUsers(async (user) => {
    const userEntity = (await jobState.addEntity(
      createUserEntity(user),
    )) as UserEntity;

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: userEntity,
      }),
    );
  });
}

export const userSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-users',
    name: 'Fetch Users',
    entities: [
      {
        resourceName: 'Jira User',
        _type: USER_ENTITY_TYPE,
        _class: USER_ENTITY_CLASS,
      },
    ],
    relationships: [
      {
        _type: ACCOUNT_USER_RELATIONSHIP_TYPE,
        _class: RelationshipClass.HAS,
        sourceType: ACCOUNT_ENTITY_TYPE,
        targetType: USER_ENTITY_TYPE,
      },
    ],
    dependsOn: ['fetch-account'],
    executionHandler: fetchUsers,
  },
];
