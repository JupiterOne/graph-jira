import {
  Issue,
  IssueFields,
  IssueTypeName,
  JiraApiVersion,
  JiraClient,
  JiraProjectId,
  JiraProjectKey,
} from './jira';

/**
 * The structure of the `properties` data provided by the JupiterOne Alert Rules
 * Jira action.
 *
 * @see createJiraIssue
 */
export interface CreateIssueActionProperties {
  project: JiraProjectKey;
  summary: string;
  classification: IssueTypeName;
  additionalFields?: IssueFields;
}

/**
 * A utility function created for use by the managed runtime.
 *
 * The JupiterOne Alert Rules Jira action will submit
 * `CreateIssueActionProperties`. The `additionalFields.description` property is
 * expected to be provided as an Atlassian Document Format (ADF) structure with
 * a single `paragraph.text` value. When the `JiraClient` is configured with
 * `apiVersion: '2'`, `additionalFields.description` will be converted to a
 * simple string containing only that value.
 */
export async function createJiraIssue(
  client: JiraClient,
  action: { properties: CreateIssueActionProperties; [k: string]: any },
): Promise<Issue> {
  const {
    summary,
    classification: issueTypeName,
    project,
    additionalFields,
  } = action.properties;

  const projectId = await getProjectIdForProjectKey(client, project);
  const newIssue = await client.addNewIssue({
    summary,
    projectId,
    issueTypeName,
    additionalFields: normalizeIssueFields(client.apiVersion, additionalFields),
  });

  return client.findIssue(newIssue.key);
}

async function getProjectIdForProjectKey(
  client: JiraClient,
  project: string,
): Promise<JiraProjectId> {
  const projectId = Number(project);

  if (!isNaN(projectId)) {
    if (project.includes('.')) {
      throw new Error(`Invalid project id provided (projectId=${project})`);
    }

    if (!Number.isInteger(projectId)) {
      throw new Error(`Invalid project id provided (projectId=${projectId})`);
    }

    return projectId;
  }

  return client.projectKeyToProjectId(project);
}

function normalizeIssueFields(
  apiVersion: JiraApiVersion,
  issueFields: IssueFields | undefined,
): IssueFields {
  const normalizedFields: IssueFields = { ...issueFields };
  if (
    apiVersion === '2' &&
    isAlertRulesDescriptionADF(normalizedFields.description)
  ) {
    normalizedFields.description = getAlertRulesDescription(
      normalizedFields.description,
    );
  }
  return normalizedFields;
}

function isAlertRulesDescriptionADF(description?: any): boolean {
  return !!(
    description &&
    description.type === 'doc' &&
    description.content.length === 1 &&
    description.content[0].content.length === 1 &&
    description.content[0].content[0].type === 'text'
  );
}

function getAlertRulesDescription(description: any): string | undefined {
  return description.content[0].content[0].text;
}
