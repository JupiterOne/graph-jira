import {
  IntegrationCacheEntry,
  IntegrationError,
  IntegrationExecutionResult,
} from "@jupiterone/jupiter-managed-integration-sdk";

import { createUserEntity } from "../converters";
import { USER_ENTITY_TYPE, UserEntity } from "../entities";
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

  const newUserEntities: UserEntity[] = [];
  await usersCache.forEach(e => {
    newUserEntities.push(createUserEntity(e.entry.data));
  });

  const existingUserEntities = await graph.findEntitiesByType<UserEntity>(
    USER_ENTITY_TYPE,
  );

  return {
    operations: await persister.publishEntityOperations([
      ...persister.processEntities(existingUserEntities, newUserEntities),
    ]),
  };
}
