import camelCase from 'lodash/camelCase';

import { ProjectConfig } from '../types';

export function normalizeCustomFieldIdentifiers(fields: string[]): string[] {
  return fields.map((f) => {
    if (f.startsWith('customfield_')) {
      return f;
    } else if (f.match(/\d{5}/)) {
      return `customfield_${f}`;
    } else {
      return camelCase(f);
    }
  });
}

// goal: give this function an array of strings, a string, or a string which is a
// JSON-formatted array, and it figures out how to return a proper array of strings
// this is needed because local execution for tests parses the 'project' attribute as
// a plain string, but execution in the managed environment should provide an array
// of strings, but some old installs might still supply just a single value string
export function buildProjectConfigs(projects: any): ProjectConfig[] {
  const projectConfigs: ProjectConfig[] = [];

  if (Array.isArray(projects)) {
    for (const v of projects) {
      if (isNonWhitespaceString(v)) {
        projectConfigs.push(buildProjectConfigWithKey(v));
      } else if (isProjectConfigObjectFormat(v)) {
        projectConfigs.push(v);
      }
    }
  } else if (isNonWhitespaceString(projects)) {
    // is it just a string value, or a stringified array?
    let parsedProjects;
    try {
      parsedProjects = JSON.parse(projects);
    } catch (err) {
      //if the JSON parsing failed, then assume it's a regular value string
    }
    if (Array.isArray(parsedProjects)) {
      for (const p of parsedProjects) {
        if (isNonWhitespaceString(p)) {
          projectConfigs.push(buildProjectConfigWithKey(p));
        }
      }
    } else {
      // assume projects was just a regular value string, not an array in disguise
      projectConfigs.push(buildProjectConfigWithKey(projects));
    }
  }

  return projectConfigs;
}

function buildProjectConfigWithKey(key: string): ProjectConfig {
  return { key };
}

function isNonWhitespaceString(v: any): boolean {
  return typeof v === 'string' && v.trim() !== '';
}

// is this an object of format { key: 'somevalue' }
function isProjectConfigObjectFormat(v: any): boolean {
  return v && isNonWhitespaceString(v.key);
}
