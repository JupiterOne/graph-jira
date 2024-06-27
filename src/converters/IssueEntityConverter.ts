import camelCase from 'lodash/camelCase';

import {
  IntegrationLogger,
  parseTimePropertyValue,
} from '@jupiterone/integration-sdk-core';

import {
  CHANGE_ISSUE_ENTITY_CLASS,
  FINDING_ISSUE_ENTITY_CLASS,
  INCIDENT_ISSUE_ENTITY_CLASS,
  ISSUE_ENTITY_CLASS,
  ISSUE_ENTITY_TYPE,
  IssueEntity,
  RISK_ISSUE_ENTITY_CLASS,
  VULN_ISSUE_ENTITY_CLASS,
} from '../entities';
import { Field, Issue, TextContent } from '../jira';
import parseContent from '../jira/parseContent';
import { generateEntityKey } from '../utils';
import {
  extractValueFromCustomField,
  UNABLE_TO_PARSE_RESPONSE,
} from './extractValueFromCustomField';

const DONE = [
  'done',
  'accepted',
  'closed',
  'canceled',
  'cancelled',
  'completed',
  'finished',
  'mitigated',
  'remediated',
  'resolved',
  'transferred',
];

function getIssueDescription(issue: Issue, apiVersion: string): string {
  const { description } = issue.fields;
  if (!description) {
    return 'no description available';
  }

  return apiVersion === '2'
    ? (description as string)
    : parseContent((description as TextContent).content);
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part, index) => {
    if (!acc) {
      return undefined;
    }

    const match = part.match(/^(\w+|\[\d+\])(?:\.(.+))?$/); 
    if (match) {
      const [, key] = match;
      if (key.startsWith('[') && key.endsWith(']')) {
        // Accessing array element
        const arrayIndex = Number(key.slice(1, -1));
        return acc[arrayIndex];
      } else {
        // Accessing object property
        return acc[key];
      }
    }
    return acc[part];
  }, obj);
}

function setFlatNestedValue(obj: any, path: string, value: any): void {
  obj[path] = value;
}

export function createIssueEntity({
  issue,
  logger,
  fieldsById,
  customFieldsToInclude,
  complexCustomFieldsToInclude,
  requestedClass,
  redactIssueDescriptions,
  apiVersion,
}: {
  issue: Issue;
  logger: IntegrationLogger;
  fieldsById?: { [id: string]: Field };
  customFieldsToInclude?: string[];
  complexCustomFieldsToInclude?: string[];
  requestedClass?: unknown;
  redactIssueDescriptions: boolean;
  apiVersion: string;
}): IssueEntity {
  fieldsById = fieldsById || {};
  customFieldsToInclude = customFieldsToInclude || [];
  complexCustomFieldsToInclude = complexCustomFieldsToInclude || [];

  const status = issue.fields.status && issue.fields.status.name;
  const issueType = issue.fields.issuetype && issue.fields.issuetype.name;
  const customFields: { [key: string]: any } = {};

  // Extract simple custom fields
  for (const [key, value] of Object.entries(issue.fields)) {
    if (
      key.startsWith('customfield_') &&
      value !== undefined &&
      value !== null &&
      fieldsById[key]
    ) {
      const fieldName = camelCase(fieldsById[key].name);
      if (
        customFieldsToInclude.includes(key) ||
        customFieldsToInclude.includes(fieldName)
      ) {
        const extractedValue = extractValueFromCustomField(value);
        if (extractedValue === UNABLE_TO_PARSE_RESPONSE) {
          logger.warn({ fieldName }, 'Unable to parse custom field');
        } else {
          customFields[fieldName] = extractedValue;
        }
      }
    }
  }

  // Handle complex custom fields
  complexCustomFieldsToInclude.forEach((path) => {
    const [baseFieldId, ...nestedPathParts] = path.split('.');
    if (issue.fields[baseFieldId] !== undefined) {
      const nestedPath = nestedPathParts.join('.');
      const fieldValue = getNestedValue(issue.fields[baseFieldId], nestedPath);
      if (fieldValue !== undefined) {
        if (fieldsById && fieldsById[baseFieldId]) {
          const baseFieldName = camelCase(fieldsById[baseFieldId].name);
          const formattedPathParts = nestedPathParts.map((part) => {
            const match = part.match(/^(\w+)(?:\[(\d+)\])?$/);
            if (match) {
              const [, key, index] = match;
              if (index !== undefined) {
                return `${camelCase(key)}${index}`;
              }
              return camelCase(key);
            }
            return camelCase(part);
          });
          const formattedPath = [baseFieldName, ...formattedPathParts].join('');
          setFlatNestedValue(customFields, formattedPath, fieldValue);
        }
      }
    }
  });

  if (!['string', 'undefined'].includes(typeof requestedClass)) {
    logger.warn(
      { requestedClass },
      'Invalid entity class. Reverting to default.',
    );
    requestedClass = undefined;
  }
  // Set issue class based on issue type or requested class
  let issueClass: string | string[];

  if (requestedClass) {
    issueClass = ['Record', 'Issue', requestedClass as string];
  } else {
    switch ((issueType || '').toLowerCase()) {
      case 'change':
        issueClass = CHANGE_ISSUE_ENTITY_CLASS;
        break;
      case 'finding':
      case 'exception':
        issueClass = FINDING_ISSUE_ENTITY_CLASS;
        break;
      case 'incident':
        issueClass = INCIDENT_ISSUE_ENTITY_CLASS;
        break;
      case 'risk':
        issueClass = RISK_ISSUE_ENTITY_CLASS;
        break;
      case 'vulnerability':
        issueClass = VULN_ISSUE_ENTITY_CLASS;
        break;
      default:
        issueClass = issue.key.startsWith('PRODCM')
          ? CHANGE_ISSUE_ENTITY_CLASS
          : ISSUE_ENTITY_CLASS;
    }
  }

  // Redact issue descriptions if necessary
  let entityDescription: string;
  if (redactIssueDescriptions) {
    if (issue.fields.description) {
      issue.fields.description = {
        type: 'text',
        text: 'REDACTED',
      };
    }
    entityDescription = 'REDACTED';
  } else {
    entityDescription = getIssueDescription(issue, apiVersion);
  }

  // Construct issue entity object
  const entity: IssueEntity = {
    _key: generateEntityKey(ISSUE_ENTITY_TYPE, issue.id),
    _type: ISSUE_ENTITY_TYPE,
    _class: issueClass,
    _rawData: [{ name: 'default', rawData: issue as any }],
    ...customFields,
    id: issue.id,
    key: issue.key,
    name: issue.key,
    displayName: issue.key,
    summary: issue.fields.summary,
    description: entityDescription,
    category: 'issue',
    webLink: `https://${issue.self.split('/')[2]}/browse/${issue.key}`,
    status,
    active: DONE.indexOf(status.toLowerCase()) < 0,
    issueType,
    reporter:
      issue.fields.reporter &&
      (issue.fields.reporter.emailAddress || issue.fields.reporter.displayName),
    assignee:
      issue.fields.assignee &&
      (issue.fields.assignee.emailAddress || issue.fields.assignee.displayName),
    creator:
      issue.fields.creator &&
      (issue.fields.creator.emailAddress || issue.fields.creator.displayName),
    createdOn: parseTimePropertyValue(issue.fields.created),
    updatedOn: parseTimePropertyValue(issue.fields.updated),
    resolvedOn: parseTimePropertyValue(issue.fields.resolutiondate),
    dueOn: parseTimePropertyValue(issue.fields.duedate),
    resolution: issue.fields.resolution
      ? issue.fields.resolution.name
      : undefined,
    labels: issue.fields.labels,
    components:
      issue.fields.components && issue.fields.components.map((c) => c.name),
    priority: issue.fields.priority && issue.fields.priority.name,
  };

  // Add event data if requested class is provided
  if (requestedClass) {
    entity._rawData?.push({ name: 'event', rawData: { requestedClass } });
  }
  return entity;
}
