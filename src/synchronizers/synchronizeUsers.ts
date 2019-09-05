import { IntegrationExecutionResult } from "@jupiterone/jupiter-managed-integration-sdk";

import { createUserEntities } from "../converters";
import * as Entities from "../entities";
import { User } from "../jira";
import { JiraCache } from "../jira/cache";
import { JiraIntegrationContext } from "../types";

export default async function(
  executionContext: JiraIntegrationContext,
): Promise<IntegrationExecutionResult> {
  const { graph, persister } = executionContext;
  const cache = executionContext.clients.getCache();
  const userCache = new JiraCache<User>("user", cache);

  if (!(await userCache.fetchSuccess())) {
    const err = new Error("Fetching of users did not complete");
    executionContext.logger.error({ err }, "User synchronization aborted");
    return {
      error: err,
    };
  }

  const userIds = await userCache.getIds();
  if (!userIds) {
    executionContext.logger.info("No users in cache");
    return {
      operations: {
        created: 0,
        updated: 0,
        deleted: 0,
      },
    };
  }

  const users = await userCache.getResources(userIds);
  const userEntities = createUserEntities(users);

  const existingUserEntities = await graph.findEntitiesByType<
    Entities.UserEntity
  >(Entities.USER_ENTITY_TYPE);

  return {
    operations: await persister.publishEntityOperations([
      ...persister.processEntities(existingUserEntities, userEntities),
    ]),
  };
}
