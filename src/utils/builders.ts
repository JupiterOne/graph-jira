import camelCase from 'lodash/camelCase';

import { JiraProjectKey } from '../jira';

const FIELD_ID = /\d{5}/;

export function normalizeCustomFieldIdentifiers(fields?: string[]): string[] {
  if (fields) {
    return fields.map((f) => {
      if (f.startsWith('customfield_')) {
        return f;
      } else if (FIELD_ID.test(f)) {
        return `customfield_${f}`;
      } else {
        return camelCase(f);
      }
    });
  } else {
    return [];
  }
}

const EMTPY_STRING = /(^$)|(^\s+$)/;

export function normalizeProjectKeys(
  projects: string | string[] | undefined,
): JiraProjectKey[] {
  if (Array.isArray(projects)) {
    return projects.filter((e) => !EMTPY_STRING.test(e)).map((e) => e.trim());
  } else if (projects && !EMTPY_STRING.test(projects)) {
    try {
      const parsedProjects = JSON.parse(projects);
      return normalizeProjectKeys(parsedProjects);
    } catch (err) {
      return normalizeProjectKeys([projects]);
    }
  } else {
    return [];
  }
}
