import {
  IntegrationStepExecutionResult,
  IntegrationStepIterationState,
} from "@jupiterone/jupiter-managed-integration-sdk";

import { User } from "../jira";
import { JiraCache } from "../jira/cache";
import { JiraIntegrationContext } from "../types";

const PAGE_SIZE = Number(process.env.USERS_PAGE_SIZE) || 200;
const PAGE_LIMIT = Number(process.env.USERS_PAGE_LIMIT) || 5;

export default async function(
  executionContext: JiraIntegrationContext,
  iterationState: IntegrationStepIterationState,
): Promise<IntegrationStepExecutionResult> {
  const { jira } = executionContext;
  const cache = executionContext.clients.getCache();
  const userCache = new JiraCache<User>("user", cache);

  const userIds: string[] =
    iterationState.iteration > 0 ? (await userCache.getIds())! : [];
  const users: User[] = [];

  let page = 0;
  let finished = false;
  let startAt = iterationState.state.startAt || 0;

  while (page < PAGE_LIMIT) {
    const usersPage = await jira.fetchUsersPage({
      startAt,
      pageSize: PAGE_SIZE,
    });

    if (usersPage.length === 0) {
      finished = true;
      break;
    }

    for (const user of usersPage) {
      userIds.push(user.key);
      users.push(user);
    }

    startAt += usersPage.length;
    page++;
  }

  await Promise.all([userCache.putResources(users), userCache.putIds(userIds)]);

  if (finished) {
    userCache.recordSuccess();
  }

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
