import { Relationship } from '@jupiterone/integration-sdk-core';

import {
  ISSUE_ENTITY_TYPE,
  USER_CREATED_ISSUE_RELATIONSHIP_CLASS,
  USER_CREATED_ISSUE_RELATIONSHIP_TYPE,
  USER_ENTITY_TYPE,
  USER_REPORTED_ISSUE_RELATIONSHIP_CLASS,
  USER_REPORTED_ISSUE_RELATIONSHIP_TYPE,
} from '../entities';
import { Issue, User, UserV2, UserV3 } from '../jira';
import { generateEntityKey } from '../utils';

// TODO(mdaum INT-3514): Test changes to this in deployment project
export function createUserCreatedIssueRelationships(
  issues: Issue[],
  apiVersion: string,
) {
  return issues.reduce((acc: Relationship[], issue) => {
    return [
      ...acc,
      createUserCreatedIssueRelationship(
        issue.fields.creator,
        issue,
        apiVersion,
      ),
    ];
  }, []);
}
function createUserCreatedIssueRelationship(
  user: User,
  issue: Issue,
  apiVersion: string,
): Relationship {
  let userKey;
  if (apiVersion === '3') {
    const castedUser = user as UserV3;
    userKey = generateEntityKey(
      USER_ENTITY_TYPE,
      castedUser.accountId as string,
    );
  } else if (apiVersion === '2') {
    const castedUser = user as UserV2;
    userKey = castedUser.key;
  } else {
    throw new Error(`Unknown Jira API version: ${apiVersion}`);
  }
  const issueKey = generateEntityKey(ISSUE_ENTITY_TYPE, issue.id);

  return {
    _class: USER_CREATED_ISSUE_RELATIONSHIP_CLASS,
    _type: USER_CREATED_ISSUE_RELATIONSHIP_TYPE,
    _fromEntityKey: userKey,
    _key: `${userKey}_created_${issueKey}`,
    _toEntityKey: issueKey,
  };
}

export function createUserReportedIssueRelationships(
  issues: Issue[],
  apiVersion: string,
) {
  return issues.reduce((acc: Relationship[], issue) => {
    if (!issue.fields.reporter) {
      return acc;
    } else {
      return [
        ...acc,
        createUserReportedIssueRelationship(
          issue.fields.reporter,
          issue,
          apiVersion,
        ),
      ];
    }
  }, []);
}
// TODO(mdaum INT-3514): Test changes to this in deployment project
function createUserReportedIssueRelationship(
  user: User,
  issue: Issue,
  apiVersion: string,
): Relationship {
  let userKey;
  if (apiVersion === '3') {
    const castedUser = user as UserV3;
    userKey = generateEntityKey(
      USER_ENTITY_TYPE,
      castedUser.accountId as string,
    );
  } else if (apiVersion === '2') {
    const castedUser = user as UserV2;
    userKey = castedUser.key;
  } else {
    throw new Error(`Unknown Jira API version: ${apiVersion}`);
  }
  const issueKey = generateEntityKey(ISSUE_ENTITY_TYPE, issue.id);

  return {
    _class: USER_REPORTED_ISSUE_RELATIONSHIP_CLASS,
    _type: USER_REPORTED_ISSUE_RELATIONSHIP_TYPE,
    _fromEntityKey: userKey,
    _key: `${userKey}_reported_${issueKey}`,
    _toEntityKey: issueKey,
  };
}
