import { Issue } from "../jira";

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
import generateEntityKey from "../utils/generateEntityKey";

export function createIssueCreatedByUserRelationships(issues: Issue[]) {
  const defaultValue: IssueCreatedByUserRelationship[] = [];

  return issues.reduce((acc, issue) => {
    const parentKey = generateEntityKey(ISSUE_ENTITY_TYPE, issue.id);
    const childKey = generateEntityKey(
      USER_ENTITY_TYPE,
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

export function createIssueReportedByUserRelationships(issues: Issue[]) {
  const defaultValue: IssueReportedByUserRelationship[] = [];

  return issues.reduce((acc, issue) => {
    if (!issue.fields.reporter) {
      return acc;
    } else {
      const parentKey = generateEntityKey(ISSUE_ENTITY_TYPE, issue.id);
      const childKey = generateEntityKey(
        USER_ENTITY_TYPE,
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
    }
  }, defaultValue);
}
