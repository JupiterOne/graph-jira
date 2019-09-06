import {
  IntegrationStepExecutionResult,
  IntegrationStepIterationState,
} from "@jupiterone/jupiter-managed-integration-sdk";

import { JiraIntegrationContext } from "../types";
import { JiraCache } from "./cache";
import { Issue } from "./types";

const PAGE_SIZE = Number(process.env.ISSUES_PAGE_SIZE) || 200;
const PAGE_LIMIT = Number(process.env.ISSUES_PAGE_LIMIT) || 10;

export default async function(
  executionContext: JiraIntegrationContext,
  iterationState: IntegrationStepIterationState,
): Promise<IntegrationStepExecutionResult> {
  const { projects, jira, lastJobTimestamp, logger } = executionContext;
  logger.trace({ projects }, "Ingesting issues for projects");
  const cache = executionContext.clients.getCache();
  const issueCache = new JiraCache<Issue>("issue", cache);

  const issueIds: string[] =
    iterationState.iteration > 0 ? (await issueCache.getIds())! : [];
  logger.trace({ issueIds }, "Fetched issue IDs from cache");
  const issues: Issue[] = [];

  let page = 0;
  let finished = false;
  let projectIndex: number = iterationState.state.projectIndex || 0;
  let startAt = iterationState.state.startAt || 0;

  while (page < PAGE_LIMIT) {
    const project = projects[projectIndex];
    logger.trace({ page, project: project.key }, "Paging through issues...");
    const issuesPage = await jira.fetchIssuesPage({
      project: project.key,
      sinceAtTimestamp: lastJobTimestamp || undefined,
      startAt,
      pageSize: PAGE_SIZE,
    });

    if (issuesPage.length === 0) {
      if (projectIndex < projects.length - 1) {
        logger.trace(
          { page, project: project.key },
          "Paged through all issues of project",
        );
        projectIndex++;
      } else {
        logger.trace(
          { page, project: project.key },
          "Paged through all issues, exiting",
        );
        finished = true;
      }

      break;
    }

    for (const issue of issuesPage) {
      issueIds.push(issue.key);
      issues.push(issue);
    }

    logger.trace(
      {
        page,
        project: project.key,
        pageAmount: issuesPage.length,
        runningTotal: issues.length,
      },
      "Paged through page of issues",
    );
    startAt += issuesPage.length;
    page++;
  }

  logger.trace("Putting issues into cache...");
  await Promise.all([
    issueCache.putResources(issues),
    issueCache.putIds(issueIds),
  ]);

  if (finished) {
    logger.trace("Recording success...");
    issueCache.recordSuccess();
  }

  logger.trace(
    { finished, startAt, project: projects[projectIndex] },
    "Finished iteration",
  );
  return {
    iterationState: {
      ...iterationState,
      finished,
      state: {
        startAt,
        projectIndex,
      },
    },
  };
}
