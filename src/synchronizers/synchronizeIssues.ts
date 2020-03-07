import {
  IntegrationCacheEntry,
  IntegrationError,
  IntegrationExecutionResult,
} from "@jupiterone/jupiter-managed-integration-sdk";

import {
  createIssueEntity,
  createProjectIssueRelationship,
  createUserCreatedIssueRelationship,
  createUserReportedIssueRelationship,
} from "../converters";
import {
  IssueEntity,
  ProjectIssueRelationship,
  UserIssueRelationship,
} from "../entities";
import { Field, Issue } from "../jira";
import { JiraIntegrationContext, ResourceCacheState } from "../types";

export default async function(
  executionContext: JiraIntegrationContext,
): Promise<IntegrationExecutionResult> {
  const { jira, persister } = executionContext;
  const cache = executionContext.clients.getCache();

  const issuesCache = cache.iterableCache<
    IntegrationCacheEntry,
    ResourceCacheState
  >("issues");

  const issuesState = await issuesCache.getState();
  if (!issuesState || !issuesState.resourceFetchCompleted) {
    throw new IntegrationError(
      "Issues fetching did not complete, cannot synchronize issues",
    );
  }

  const fields = await jira.fetchFields();
  const fieldsById: { [id: string]: Field } = {};

  for (const field of fields) {
    fieldsById[field.id] = field;
  }

  const projectIssueRelationships: ProjectIssueRelationship[] = [];
  const userCreatedIssueRelationships: UserIssueRelationship[] = [];
  const userReportedIssueRelationships: UserIssueRelationship[] = [];

  const newEntities: IssueEntity[] = [];
  await issuesCache.forEach(e => {
    const issue: Issue = e.entry.data;
    newEntities.push(createIssueEntity(issue, fieldsById));
    projectIssueRelationships.push(
      createProjectIssueRelationship(issue.fields.project, issue),
    );
    userCreatedIssueRelationships.push(
      createUserCreatedIssueRelationship(issue.fields.creator, issue),
    );
    if (issue.fields.reporter) {
      userReportedIssueRelationships.push(
        createUserReportedIssueRelationship(issue.fields.reporter, issue),
      );
    }
  });

  return {
    operations: await persister.publishPersisterOperations([
      persister.processEntities([], newEntities),
      [
        ...persister.processRelationships([], projectIssueRelationships),
        ...persister.processRelationships([], userCreatedIssueRelationships),
        ...persister.processRelationships([], userReportedIssueRelationships),
      ],
    ]),
  };
}
