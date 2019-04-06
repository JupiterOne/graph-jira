import { Issue } from "../jira";
import {
  ISSUE_ENTITY_CLASS,
  ISSUE_ENTITY_TYPE,
  IssueEntity,
} from "../jupiterone";

import generateEntityKey from "../utils/generateEntityKey";

export function createIssueEntities(data: Issue[]): IssueEntity[] {
  return data.map(issue => {
    const issueEntity: IssueEntity = {
      _key: generateEntityKey(ISSUE_ENTITY_TYPE, issue.id),
      _type: ISSUE_ENTITY_TYPE,
      _class: ISSUE_ENTITY_CLASS,
      id: issue.id,
      name: issue.key,
      displayName: issue.key,
      summary: issue.fields.summary,
      category: "issue",
      webLink: `https://${issue.self.split("/")[2]}/browse/${issue.key}`,
      status: issue.fields.status.name,
      reporter: issue.fields.reporter && issue.fields.reporter.name,
      assignee:
        (issue.fields.assignee && issue.fields.assignee.name) || undefined,
      creator: issue.fields.creator && issue.fields.creator.name,
    };

    return issueEntity;
  });
}
