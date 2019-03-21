import { Issue, Project } from "../jira";

import {
  ISSUE_ENTITY_TYPE,
  PROJECT_ENTITY_TYPE,
  PROJECT_ISSUE_RELATIONSHIP_CLASS,
  PROJECT_ISSUE_RELATIONSHIP_TYPE,
  ProjectIssueRelationship,
} from "../jupiterone";
import generateKey from "../utils/generateKey";

export function createProjectIssueRelationships(
  projects: Project[],
  issues: Issue[],
) {
  const defaultValue: ProjectIssueRelationship[] = [];

  return issues.reduce((acc, issue) => {
    const parentKey = generateParentKeyForIssue(projects, issue);
    const childKey = generateKey(ISSUE_ENTITY_TYPE, issue.id);

    const relationship: ProjectIssueRelationship = {
      _class: PROJECT_ISSUE_RELATIONSHIP_CLASS,
      _type: PROJECT_ISSUE_RELATIONSHIP_TYPE,
      _fromEntityKey: parentKey,
      _key: `${parentKey}_has_${childKey}`,
      _toEntityKey: childKey,
    };

    return [...acc, relationship];
  }, defaultValue);
}

function generateParentKeyForIssue(projects: Project[], issue: Issue): string {
  return generateKey(PROJECT_ENTITY_TYPE, issue.fields.project.id);
}
