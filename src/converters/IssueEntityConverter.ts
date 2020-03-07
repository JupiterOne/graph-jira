import camelCase from "lodash/camelCase";

import {
  CHANGE_ISSUE_ENTITY_CLASS,
  FINDING_ISSUE_ENTITY_CLASS,
  INCIDENT_ISSUE_ENTITY_CLASS,
  ISSUE_ENTITY_CLASS,
  ISSUE_ENTITY_TYPE,
  IssueEntity,
  RISK_ISSUE_ENTITY_CLASS,
  VULN_ISSUE_ENTITY_CLASS,
} from "../entities";
import { Field, Issue, TextContent } from "../jira";
import parseContent from "../jira/parseContent";
import generateEntityKey from "../utils/generateEntityKey";
import getTime from "../utils/getTime";

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

export function createIssueEntity(
  issue: Issue,
  fieldsById: { [id: string]: Field } = {},
): IssueEntity {
  const status = issue.fields.status && issue.fields.status.name;
  const issueType = issue.fields.issuetype && issue.fields.issuetype.name;
  const customFields: { [key: string]: any } = {};

  for (const [key, value] of Object.entries(issue.fields)) {
    if (key.startsWith("customfield_") && value && fieldsById[key]) {
      const fieldName = camelCase(fieldsById[key].name);
      if (typeof value === "string") {
        customFields[fieldName] = value;
      } else if (typeof value === "object") {
        if (value.type === "doc" && value.content) {
          customFields[fieldName] = parseContent(
            value.content as TextContent[],
          );
        }
      }
    }
  }

  let issueClass: string | string[];
  switch ((issueType || "").toLowerCase()) {
    case "change":
      issueClass = CHANGE_ISSUE_ENTITY_CLASS;
      break;
    case "finding":
      issueClass = FINDING_ISSUE_ENTITY_CLASS;
      break;
    case "incident":
      issueClass = INCIDENT_ISSUE_ENTITY_CLASS;
      break;
    case "risk":
      issueClass = RISK_ISSUE_ENTITY_CLASS;
      break;
    case "vulnerability":
      issueClass = VULN_ISSUE_ENTITY_CLASS;
      break;
    default:
      issueClass = issue.key.startsWith("PRODCM")
        ? CHANGE_ISSUE_ENTITY_CLASS
        : ISSUE_ENTITY_CLASS;
  }

  return {
    _key: generateEntityKey(ISSUE_ENTITY_TYPE, issue.id),
    _type: ISSUE_ENTITY_TYPE,
    _scope: ISSUE_ENTITY_TYPE,
    _class: issueClass,
    ...customFields,
    id: issue.id,
    key: issue.key,
    name: issue.key,
    displayName: issue.key,
    summary: issue.fields.summary,
    description:
      issue.fields.description &&
      parseContent(issue.fields.description.content),
    category: "issue",
    webLink: `https://${issue.self.split("/")[2]}/browse/${issue.key}`,
    status,
    active: DONE.indexOf(status.toLowerCase()) < 0,
    issueType,
    reporter: issue.fields.reporter && issue.fields.reporter.name,
    assignee: issue.fields.assignee && issue.fields.assignee.name,
    creator: issue.fields.creator && issue.fields.creator.name,
    createdOn: getTime(issue.fields.created),
    updatedOn: getTime(issue.fields.updated),
    resolvedOn: getTime(issue.fields.resolutiondate),
    dueOn: getTime(issue.fields.duedate),
    resolution: issue.fields.resolution
      ? issue.fields.resolution.name
      : undefined,
    labels: issue.fields.labels,
    components:
      issue.fields.components && issue.fields.components.map(c => c.name),
    priority: issue.fields.priority && issue.fields.priority.name,
  };
}
