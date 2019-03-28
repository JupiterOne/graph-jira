import { Issue, User } from "../jira";

import {
  ISSUE_CREATED_BY_USER_RELATIONSHIP_CLASS,
  ISSUE_CREATED_BY_USER_RELATIONSHIP_TYPE,
  ISSUE_REPORTED_BY_USER_RELATIONSHIP_CLASS,
  ISSUE_REPORTED_BY_USER_RELATIONSHIP_TYPE,
  IssueCreatedByUserRelationship,
  IssueReportedByUserRelationship,
} from "../jupiterone";

export function createIssueCreatedByUserRelationships(
  issues: Issue[],
  users: User[],
) {
  const defaultValue: IssueCreatedByUserRelationship[] = [];

  return issues.reduce((acc, issue) => {
    const parentKey = issue.id;
    const childKey = issue.fields.creator.accountId;
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
    const childKey = issue.fields.reporter.accountId;

    const relationship: IssueReportedByUserRelationship = {
      _class: ISSUE_REPORTED_BY_USER_RELATIONSHIP_CLASS,
      _type: ISSUE_REPORTED_BY_USER_RELATIONSHIP_TYPE,
      _fromEntityKey: issue.id,
      _key: `${issue.id}_reportedBy_${childKey}`,
      _toEntityKey: childKey,
    };

    return [...acc, relationship];
  }, defaultValue);
}
