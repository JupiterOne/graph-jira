import {
  ISSUE_ENTITY_TYPE,
  USER_CREATED_ISSUE_RELATIONSHIP_CLASS,
  USER_CREATED_ISSUE_RELATIONSHIP_TYPE,
  USER_ENTITY_TYPE,
  USER_REPORTED_ISSUE_RELATIONSHIP_CLASS,
  USER_REPORTED_ISSUE_RELATIONSHIP_TYPE,
  UserIssueRelationship,
} from "../entities";
import { Issue } from "../jira";
import generateEntityKey from "../utils/generateEntityKey";

export function createUserCreatedIssueRelationships(issues: Issue[]) {
  const defaultValue: UserIssueRelationship[] = [];

  return issues.reduce((acc, issue) => {
    const childKey = generateEntityKey(ISSUE_ENTITY_TYPE, issue.id);
    const parentKey = generateEntityKey(
      USER_ENTITY_TYPE,
      issue.fields.creator.accountId,
    );
    const relationship: UserIssueRelationship = {
      _class: USER_CREATED_ISSUE_RELATIONSHIP_CLASS,
      _type: USER_CREATED_ISSUE_RELATIONSHIP_TYPE,
      _scope: USER_CREATED_ISSUE_RELATIONSHIP_TYPE,
      _fromEntityKey: parentKey,
      _key: `${parentKey}_created_${childKey}`,
      _toEntityKey: childKey,
    };

    return [...acc, relationship];
  }, defaultValue);
}

export function createUserReportedIssueRelationships(issues: Issue[]) {
  const defaultValue: UserIssueRelationship[] = [];

  return issues.reduce((acc, issue) => {
    if (!issue.fields.reporter) {
      return acc;
    } else {
      const childKey = generateEntityKey(ISSUE_ENTITY_TYPE, issue.id);
      const parentKey = generateEntityKey(
        USER_ENTITY_TYPE,
        issue.fields.reporter.accountId,
      );

      const relationship: UserIssueRelationship = {
        _class: USER_REPORTED_ISSUE_RELATIONSHIP_CLASS,
        _type: USER_REPORTED_ISSUE_RELATIONSHIP_TYPE,
        _scope: USER_REPORTED_ISSUE_RELATIONSHIP_TYPE,
        _fromEntityKey: parentKey,
        _key: `${parentKey}_reported_${childKey}`,
        _toEntityKey: childKey,
      };

      return [...acc, relationship];
    }
  }, defaultValue);
}
