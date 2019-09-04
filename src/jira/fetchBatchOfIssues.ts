import {
  IntegrationStepExecutionResult,
  IntegrationStepIterationState,
} from "@jupiterone/jupiter-managed-integration-sdk";

import { JiraIntegrationContext } from "../types";
import { JiraCache } from "./cache";
import { Issue } from "./types";

const PAGE_SIZE = Number(process.env.ISSUES_PAGE_SIZE) || 200;
const PAGE_LIMIT = Number(process.env.ISSUES_PAGE_LIMIT) || 2;

export default async function(
  executionContext: JiraIntegrationContext,
  iterationState: IntegrationStepIterationState,
): Promise<IntegrationStepExecutionResult> {
  const { projects, jira, lastJobTimestamp } = executionContext;
  const cache = executionContext.clients.getCache();
  const issueCache = new JiraCache<Issue>("issue", cache);

  const issueIds: string[] =
    iterationState.iteration > 0 ? (await issueCache.getIds())! : [];
  const issues: Issue[] = [];

  let page = 0;
  let finished = false;
  let projectIndex: number = iterationState.state.projectIndex || 0;
  let startAt = iterationState.state.startAt || 0;

  while (page < PAGE_LIMIT) {
    const issuesPage = await jira.fetchIssuesPage({
      project: projects[projectIndex].key,
      sinceAtTimestamp: lastJobTimestamp || undefined,
      startAt,
      pageSize: PAGE_SIZE,
    });

    if (issuesPage.length === 0) {
      if (projectIndex < projects.length - 1) {
        projectIndex++;
      } else {
        finished = true;
      }

      break;
    }

    for (const issue of issuesPage) {
      issueIds.push(issue.id);
      issues.push(issue);
    }

    startAt += issuesPage.length;
    page++;
  }

  await Promise.all([
    issueCache.putResources(issues),
    issueCache.putIds(issueIds),
  ]);

  if (finished) {
    issueCache.recordSuccess();
  }

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
