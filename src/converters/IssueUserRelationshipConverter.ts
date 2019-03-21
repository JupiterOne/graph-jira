import { Issue, User } from "../jira";

import {
  ISSUE_CREATED_BY_USER_RELATIONSHIP_CLASS,
  ISSUE_CREATED_BY_USER_RELATIONSHIP_TYPE,
  ISSUE_ENTITY_TYPE,
  ISSUE_REPORTED_BY_USER_RELATIONSHIP_CLASS,
  ISSUE_REPORTED_BY_USER_RELATIONSHIP_TYPE,
  IssueCreatedByUserRelationship,
  IssueReportedByUserRelationship,
  USER_ENTITY_TYPE,
} from "../jupiterone";

import generateKey from "../utils/generateKey";

export function createIssueCreatedByUserRelationships(
  issues: Issue[],
  users: User[],
) {
  const defaultValue: IssueCreatedByUserRelationship[] = [];

  return issues.reduce((acc, issue) => {
    const parentKey = generateKey(ISSUE_ENTITY_TYPE, issue.id);
    const childKey = generateChildKeyForIssue(
      users,
      issue.fields.creator.accountId,
    );

    const relationship: IssueCreatedByUserRelationship = {
      _class: ISSUE_CREATED_BY_USER_RELATIONSHIP_CLASS,
      _type: ISSUE_CREATED_BY_USER_RELATIONSHIP_TYPE,
      _fromEntityKey: parentKey,
      _key: `${parentKey}_createdBy_${childKey}`,
      _toEntityKey: childKey,
    };

    return [...acc, relationship];
  }, defaultValue);
}

export function createIssueReportedByUserRelationships(
  issues: Issue[],
  users: User[],
) {
  const defaultValue: IssueReportedByUserRelationship[] = [];

  return issues.reduce((acc, issue) => {
    const parentKey = generateKey(ISSUE_ENTITY_TYPE, issue.id);
    const childKey = generateChildKeyForIssue(
      users,
      issue.fields.reporter.accountId,
    );

    const relationship: IssueReportedByUserRelationship = {
      _class: ISSUE_REPORTED_BY_USER_RELATIONSHIP_CLASS,
      _type: ISSUE_REPORTED_BY_USER_RELATIONSHIP_TYPE,
      _fromEntityKey: parentKey,
      _key: `${parentKey}_reportedBy_${childKey}`,
      _toEntityKey: childKey,
    };

    return [...acc, relationship];
  }, defaultValue);
}

function generateChildKeyForIssue(users: User[], issueId: string): string {
  const user = findUserByIssue(users, issueId);
  return user
    ? generateKey(USER_ENTITY_TYPE, user.accountId)
    : generateKey(USER_ENTITY_TYPE);
}

function findUserByIssue(users: User[], issueId: string): User | undefined {
  return users.find(user => user.accountId === issueId);
}
