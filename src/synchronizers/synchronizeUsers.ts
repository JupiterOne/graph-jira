import {
  createIntegrationRelationship,
  DataModel,
  IntegrationCacheEntry,
  IntegrationError,
  IntegrationExecutionResult,
  IntegrationRelationship,
  summarizePersisterOperationsResults,
} from "@jupiterone/jupiter-managed-integration-sdk";

import { createUserEntity } from "../converters";
import {
  ACCOUNT_ENTITY_TYPE,
  ACCOUNT_USER_RELATIONSHIP_TYPE,
  AccountEntity,
  USER_ENTITY_TYPE,
  UserEntity,
} from "../entities";
import { JiraIntegrationContext, ResourceCacheState } from "../types";

export default async function(
  executionContext: JiraIntegrationContext,
): Promise<IntegrationExecutionResult> {
  const { graph, persister } = executionContext;
  const cache = executionContext.clients.getCache();
  const usersCache = cache.iterableCache<
    IntegrationCacheEntry,
    ResourceCacheState
  >("users");

  const usersState = await usersCache.getState();
  if (!usersState || !usersState.resourceFetchCompleted) {
    throw new IntegrationError(
      "Users fetching did not complete, cannot synchronize users",
    );
  }

  const [
    existingJiraAccounts,
    existingUserEntities,
    existingAccountUserRelationships,
  ] = await Promise.all([
    graph.findEntitiesByType<AccountEntity>(ACCOUNT_ENTITY_TYPE),
    graph.findEntitiesByType<UserEntity>(USER_ENTITY_TYPE),
    graph.findRelationshipsByType<IntegrationRelationship>(
      ACCOUNT_USER_RELATIONSHIP_TYPE,
    ),
  ]);

  const accountEntity = existingJiraAccounts && existingJiraAccounts[0];
  const newUserEntities: UserEntity[] = [];
  const newAccountUserRelationships: IntegrationRelationship[] = [];
  await usersCache.forEach(e => {
    const entity = createUserEntity(e.entry.data);
    newUserEntities.push(entity);
    if (accountEntity) {
      newAccountUserRelationships.push(
        createIntegrationRelationship({
          _class: DataModel.RelationshipClass.HAS,
          fromKey: accountEntity._key,
          fromType: accountEntity._type,
          toKey: entity._key,
          toType: entity._type,
        }),
      );
    }
  });

  const entityOperations = persister.processEntities({
    oldEntities: existingUserEntities,
    newEntities: newUserEntities,
  });

  const relationshipOperations = persister.processRelationships({
    oldRelationships: existingAccountUserRelationships,
    newRelationships: newAccountUserRelationships,
  });

  return {
    operations: summarizePersisterOperationsResults(
      await persister.publishPersisterOperations([
        entityOperations,
        relationshipOperations,
      ]),
    ),
  };
}
