import {
  ISSUE_ENTITY_TYPE,
  USER_CREATED_ISSUE_RELATIONSHIP_CLASS,
  USER_CREATED_ISSUE_RELATIONSHIP_TYPE,
  USER_ENTITY_TYPE,
  USER_REPORTED_ISSUE_RELATIONSHIP_CLASS,
  USER_REPORTED_ISSUE_RELATIONSHIP_TYPE,
  UserIssueRelationship,
} from "../entities";
import { Issue, User } from "../jira";
import generateEntityKey from "../utils/generateEntityKey";

export function createUserCreatedIssueRelationships(issues: Issue[]) {
  return issues.reduce((acc: UserIssueRelationship[], issue) => {
    return [
      ...acc,
      createUserCreatedIssueRelationship(issue.fields.creator, issue),
    ];
  }, []);
}

export function createUserCreatedIssueRelationship(
  user: User,
  issue: Issue,
): UserIssueRelationship {
  const userKey = generateEntityKey(USER_ENTITY_TYPE, user.accountId);
  const issueKey = generateEntityKey(ISSUE_ENTITY_TYPE, issue.id);

  return {
    _class: USER_CREATED_ISSUE_RELATIONSHIP_CLASS,
    _type: USER_CREATED_ISSUE_RELATIONSHIP_TYPE,
    _scope: USER_CREATED_ISSUE_RELATIONSHIP_TYPE,
    _fromEntityKey: userKey,
    _key: `${userKey}_created_${issueKey}`,
    _toEntityKey: issueKey,
  };
}

export function createUserReportedIssueRelationships(issues: Issue[]) {
  return issues.reduce((acc: UserIssueRelationship[], issue) => {
    if (!issue.fields.reporter) {
      return acc;
    } else {
      return [
        ...acc,
        createUserReportedIssueRelationship(issue.fields.reporter, issue),
      ];
    }
  }, []);
}

export function createUserReportedIssueRelationship(
  user: User,
  issue: Issue,
): UserIssueRelationship {
  const userKey = generateEntityKey(USER_ENTITY_TYPE, user.accountId);
  const issueKey = generateEntityKey(ISSUE_ENTITY_TYPE, issue.id);

  return {
    _class: USER_REPORTED_ISSUE_RELATIONSHIP_CLASS,
    _type: USER_REPORTED_ISSUE_RELATIONSHIP_TYPE,
    _scope: USER_REPORTED_ISSUE_RELATIONSHIP_TYPE,
    _fromEntityKey: userKey,
    _key: `${userKey}_reported_${issueKey}`,
    _toEntityKey: issueKey,
  };
}
