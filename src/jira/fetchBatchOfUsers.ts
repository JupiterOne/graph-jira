import {
  IntegrationCacheEntry,
  IntegrationStepExecutionResult,
  IntegrationStepIterationState,
} from "@jupiterone/jupiter-managed-integration-sdk";

import { JiraIntegrationContext, ResourceCacheState } from "../types";

const PAGE_SIZE = Number(process.env.USERS_PAGE_SIZE) || 200;
const PAGE_LIMIT = Number(process.env.USERS_PAGE_LIMIT) || 10;

export default async function(
  executionContext: JiraIntegrationContext,
  iterationState: IntegrationStepIterationState,
): Promise<IntegrationStepExecutionResult> {
  const { jira, logger } = executionContext;
  const cache = executionContext.clients.getCache();

  const usersCache = cache.iterableCache<
    IntegrationCacheEntry,
    ResourceCacheState
  >("users");

  let pagesProcessed = 0;
  let finished = false;
  let startAt = iterationState.state.startAt || 0;
  let entryCount: number = iterationState.state.count || 0;

  while (pagesProcessed < PAGE_LIMIT) {
    const usersPage = await jira.fetchUsersPage({
      startAt,
      pageSize: PAGE_SIZE,
    });

    if (usersPage.length === 0) {
      finished = true;
      break;
    } else {
      entryCount = await usersCache.putEntries(
        usersPage.map(e => ({
          key: e.accountId,
          data: e,
        })),
      );
    }

    logger.info(
      { pagesProcessed, usersPageLength: usersPage.length, entryCount },
      "Fetched page of users",
    );

    startAt += usersPage.length;
    pagesProcessed++;
  }

  await usersCache.putState({ resourceFetchCompleted: finished });

  return {
    ...iterationState,
    finished,
    state: {
      startAt,
      count: entryCount,
    },
  };
}
