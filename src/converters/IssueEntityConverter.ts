import { Issue } from "../jira";
import {
  ISSUE_ENTITY_CLASS,
  ISSUE_ENTITY_TYPE,
  IssueEntity,
} from "../jupiterone";

import generateKey from "../utils/generateKey";

export function createIssueEntities(data: Issue[]): IssueEntity[] {
  return data.map(issue => {
    const issueEntity: IssueEntity = {
      _key: generateKey(ISSUE_ENTITY_TYPE, issue.id),
      _type: ISSUE_ENTITY_TYPE,
      _class: ISSUE_ENTITY_CLASS,
      id: issue.id,
      name: issue.key,
      summary: issue.fields.summary,
      category: "issue",
      webLink: issue.self,
      status: issue.fields.status.name,
      reporter: issue.fields.reporter && issue.fields.reporter.name,
      assignee: (issue.fields.assignee && issue.fields.assignee.name) || "",
      creator: issue.fields.creator && issue.fields.creator.name,
    };

    return issueEntity;
  });
}
