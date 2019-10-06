import { IntegrationExecutionResult } from "@jupiterone/jupiter-managed-integration-sdk";

import {
  createIssueEntities,
  createProjectIssueRelationships,
  createUserCreatedIssueRelationships,
  createUserReportedIssueRelationships,
} from "../converters";
import * as Entities from "../entities";
import { Issue } from "../jira";
import { JiraCache } from "../jira/cache";
import { JiraIntegrationContext } from "../types";

export default async function(
  executionContext: JiraIntegrationContext,
): Promise<IntegrationExecutionResult> {
  const { graph, persister, logger } = executionContext;
  const cache = executionContext.clients.getCache();
  const issueCache = new JiraCache<Issue>("issue", cache);

  if (!(await issueCache.fetchSuccess())) {
    const err = new Error("Fetching of issues did not complete");
    executionContext.logger.error({ err }, "Issue synchronization aborted");
    return {
      error: err,
    };
  }

  const issueIds = await issueCache.getIds();
  logger.debug(
    { issueIds },
    "Fetched issue IDs from cache for synchronization",
  );
  if (!issueIds) {
    executionContext.logger.info("No issues in cache");
    return {
      operations: {
        created: 0,
        updated: 0,
        deleted: 0,
      },
    };
  }

  const issues = await issueCache.getResources(issueIds);
  logger.debug(
    { issuesCount: issues.length },
    "Fetched issues from cache for synchronization",
  );
  const issueEntities = createIssueEntities(issues);

  const existingIssueEntities = await graph.findEntitiesByType<
    Entities.IssueEntity
  >(Entities.ISSUE_ENTITY_TYPE);

  const entityOperations = persister.processEntities(
    existingIssueEntities,
    issueEntities,
  );

  const projectIssueRelationships = createProjectIssueRelationships(issues);
  const userCreatedIssueRelationships = createUserCreatedIssueRelationships(
    issues,
  );
  const userReportedIssueRelationships = createUserReportedIssueRelationships(
    issues,
  );

  const relationshipOperations = [
    ...persister.processRelationships([], projectIssueRelationships),
    ...persister.processRelationships([], userCreatedIssueRelationships),
    ...persister.processRelationships([], userReportedIssueRelationships),
  ];

  return {
    operations: await persister.publishPersisterOperations([
      entityOperations,
      relationshipOperations,
    ]),
  };
}
