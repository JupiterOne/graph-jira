import {
  IntegrationStepExecutionResult,
  IntegrationStepIterationState,
} from "@jupiterone/jupiter-managed-integration-sdk";

import { User } from "../jira";
import { JiraCache } from "../jira/cache";
import { JiraIntegrationContext } from "../types";

const PAGE_SIZE = Number(process.env.USERS_PAGE_SIZE) || 5;
const PAGE_LIMIT = Number(process.env.USERS_PAGE_LIMIT) || 5;

export default async function(
  executionContext: JiraIntegrationContext,
  iterationState: IntegrationStepIterationState,
): Promise<IntegrationStepExecutionResult> {
  const { jira, logger } = executionContext;
  const cache = executionContext.clients.getCache();
  const userCache = new JiraCache<User>("user", cache);

  const userIds: string[] =
    iterationState.iteration > 0 ? (await userCache.getIds())! : [];
  logger.trace({ userIds }, "Fetched user IDs from cache");
  const users: User[] = [];

  let page = 0;
  let finished = false;
  let startAt = iterationState.state.startAt || 0;

  while (page < PAGE_LIMIT) {
    logger.trace({ page }, "Paging through users...");
    const usersPage = await jira.fetchUsersPage({
      startAt,
      pageSize: PAGE_SIZE,
    });

    if (usersPage.length === 0) {
      logger.trace({ page }, "Paged through all users, exiting");
      finished = true;
      break;
    }

    for (const user of usersPage) {
      userIds.push(user.key);
      users.push(user);
    }

    logger.trace(
      { page, pageAmount: usersPage.length, runningTotal: users.length },
      "Paged through page of users",
    );
    startAt += usersPage.length;
    page++;
  }

  logger.trace("Putting users into cache...");
  await Promise.all([userCache.putResources(users), userCache.putIds(userIds)]);

  if (finished) {
    logger.trace("Recording success...");
    userCache.recordSuccess();
  }

  logger.trace({ finished, startAt }, "Finished iteration");
  return {
    iterationState: {
      ...iterationState,
      finished,
      state: {
        startAt,
      },
    },
  };
}
