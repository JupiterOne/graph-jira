import {
  ISSUE_ENTITY_TYPE,
  PROJECT_ENTITY_TYPE,
  PROJECT_ISSUE_RELATIONSHIP_CLASS,
  PROJECT_ISSUE_RELATIONSHIP_TYPE,
  ProjectIssueRelationship,
} from "../entities";
import { Issue, Project } from "../jira";
import generateEntityKey from "../utils/generateEntityKey";

export function createProjectIssueRelationships(issues: Issue[]) {
  return issues.reduce((acc: ProjectIssueRelationship[], issue) => {
    return [
      ...acc,
      createProjectIssueRelationship(issue.fields.project, issue),
    ];
  }, []);
}

export function createProjectIssueRelationship(
  project: Project,
  issue: Issue,
): ProjectIssueRelationship {
  const projectKey = generateEntityKey(PROJECT_ENTITY_TYPE, project.id);
  const issueKey = generateEntityKey(ISSUE_ENTITY_TYPE, issue.id);

  return {
    _class: PROJECT_ISSUE_RELATIONSHIP_CLASS,
    _type: PROJECT_ISSUE_RELATIONSHIP_TYPE,
    _fromEntityKey: projectKey,
    _key: `${projectKey}_has_${issueKey}`,
    _toEntityKey: issueKey,
  };
}
