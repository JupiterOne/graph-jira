import {
  IntegrationCacheEntry,
  IntegrationStepExecutionResult,
  IntegrationStepIterationState,
} from "@jupiterone/jupiter-managed-integration-sdk";

import { JiraIntegrationContext, ResourceCacheState } from "../types";

const PAGE_SIZE = Number(process.env.ISSUES_PAGE_SIZE) || 200;
const PAGE_LIMIT = Number(process.env.ISSUES_PAGE_LIMIT) || 10;

export default async function(
  executionContext: JiraIntegrationContext,
  iterationState: IntegrationStepIterationState,
): Promise<IntegrationStepExecutionResult> {
  const { projects, jira, lastJobTimestamp, logger } = executionContext;

  const cache = executionContext.clients.getCache();

  const issuesCache = cache.iterableCache<
    IntegrationCacheEntry,
    ResourceCacheState
  >("issues");

  let pagesProcessed = 0;
  let finished = false;
  let projectIndex: number = iterationState.state.projectIndex || 0;
  let startAt = iterationState.state.startAt || 0;
  let entryCount: number = iterationState.state.count || 0;

  while (pagesProcessed < PAGE_LIMIT) {
    const project = projects[projectIndex];
    const issuesPage = await jira.fetchIssuesPage({
      project: project.key,
      sinceAtTimestamp: lastJobTimestamp || undefined,
      startAt,
      pageSize: PAGE_SIZE,
    });

    if (issuesPage.length === 0) {
      if (projectIndex < projects.length - 1) {
        projectIndex++;
        startAt = 0;
      } else {
        finished = true;
      }

      break;
    }

    entryCount = await issuesCache.putEntries(
      issuesPage.map(e => ({
        key: e.key,
        data: e,
      })),
    );

    logger.info(
      { pagesProcessed, issuesPageLength: issuesPage.length, entryCount },
      "Fetched page of issues",
    );

    startAt += issuesPage.length;
    pagesProcessed++;
  }

  await issuesCache.putState({ resourceFetchCompleted: finished });

  return {
    ...iterationState,
    finished,
    state: {
      startAt,
      projectIndex,
      count: entryCount,
    },
  };
}
