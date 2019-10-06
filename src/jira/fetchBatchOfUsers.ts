import {
  IntegrationStepExecutionResult,
  IntegrationStepIterationState,
} from "@jupiterone/jupiter-managed-integration-sdk";

import { User } from "../jira";
import { JiraCache } from "../jira/cache";
import { JiraIntegrationContext } from "../types";

const PAGE_SIZE = Number(process.env.USERS_PAGE_SIZE) || 200;
const PAGE_LIMIT = Number(process.env.USERS_PAGE_LIMIT) || 10;

export default async function(
  executionContext: JiraIntegrationContext,
  iterationState: IntegrationStepIterationState,
): Promise<IntegrationStepExecutionResult> {
  const { jira, logger } = executionContext;
  const cache = executionContext.clients.getCache();
  const userCache = new JiraCache<User>("user", cache);

  const userIds: string[] =
    iterationState.iteration > 0 ? (await userCache.getIds())! : [];
  logger.debug({ userIds }, "Fetched user IDs from cache");
  const users: User[] = [];

  let page = 0;
  let finished = false;
  let startAt = iterationState.state.startAt || 0;

  while (page < PAGE_LIMIT) {
    logger.debug({ page }, "Paging through users...");
    const usersPage = await jira.fetchUsersPage({
      startAt,
      pageSize: PAGE_SIZE,
    });

    if (usersPage.length === 0) {
      logger.debug({ page }, "Paged through all users, exiting");
      finished = true;
      break;
    }

    for (const user of usersPage) {
      userIds.push(user.key);
      users.push(user);
    }

    logger.debug(
      { page, pageAmount: usersPage.length, runningTotal: users.length },
      "Paged through page of users",
    );
    startAt += usersPage.length;
    page++;
  }

  logger.debug("Putting users into cache...");
  await Promise.all([userCache.putResources(users), userCache.putIds(userIds)]);

  if (finished) {
    logger.debug("Recording success...");
    userCache.recordSuccess();
  }

  logger.debug({ finished, startAt }, "Finished iteration");
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
