import { Issue } from "../jira";

import {
  ISSUE_ENTITY_TYPE,
  PROJECT_ENTITY_TYPE,
  PROJECT_ISSUE_RELATIONSHIP_CLASS,
  PROJECT_ISSUE_RELATIONSHIP_TYPE,
  ProjectIssueRelationship,
} from "../entities";
import generateEntityKey from "../utils/generateEntityKey";

export function createProjectIssueRelationships(issues: Issue[]) {
  const defaultValue: ProjectIssueRelationship[] = [];

  return issues.reduce((acc, issue) => {
    const parentKey = generateEntityKey(
      PROJECT_ENTITY_TYPE,
      issue.fields.project.id,
    );
    const childKey = generateEntityKey(ISSUE_ENTITY_TYPE, issue.id);

    const relationship: ProjectIssueRelationship = {
      _class: PROJECT_ISSUE_RELATIONSHIP_CLASS,
      _type: PROJECT_ISSUE_RELATIONSHIP_TYPE,
      _scope: PROJECT_ISSUE_RELATIONSHIP_TYPE,
      _fromEntityKey: parentKey,
      _key: `${parentKey}_has_${childKey}`,
      _toEntityKey: childKey,
    };

    return [...acc, relationship];
  }, defaultValue);
}
