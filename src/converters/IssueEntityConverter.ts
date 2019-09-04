import {
  ISSUE_ENTITY_CLASS,
  ISSUE_ENTITY_TYPE,
  IssueEntity,
} from "../entities";
import { Issue } from "../jira";

import generateEntityKey from "../utils/generateEntityKey";

const DONE = [
  "done",
  "accepted",
  "closed",
  "canceled",
  "cancelled",
  "completed",
  "finished",
  "mitigated",
  "remediated",
  "resolved",
  "transferred",
];

export function createIssueEntities(data: Issue[]): IssueEntity[] {
  return data.map(issue => {
    const status = issue.fields.status.name;
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
      status,
      active: DONE.indexOf(status.toLowerCase()) < 0,
      issueType: issue.fields.issuetype.name,
      reporter: issue.fields.reporter && issue.fields.reporter.name,
      assignee:
        (issue.fields.assignee && issue.fields.assignee.name) || undefined,
      creator: issue.fields.creator && issue.fields.creator.name,
    };

    return issueEntity;
  });
}
