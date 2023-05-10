import { S3 } from 'aws-sdk';
import {
  Issue,
  IssueFields,
  IssueTypeName,
  JiraApiVersion,
  JiraClient,
  JiraProjectId,
  JiraProjectKey,
} from './jira';
import { markdownToADF } from './utils/markdownToADF';

const ISSUE_DESCRIPTION_CHARACTER_LIMIT = 32767;
const DESCRIPTION_WHEN_TOO_LONG =
  'The description exceeded the maximum length allowed by Jira, so JupiterOne has attached the contents as a file to this issue.';
const jupiteroneEnv = process.env.JUPITERONE_ENVIRONMENT;
const jiraActionsBucket = 'jupiter-integration-jira-actions';

/**
 * The structure of the `properties` data provided by the JupiterOne Alert Rules
 * Jira action.
 *
 * @see createJiraIssue
 */
export type CreateIssueActionProperties =
  | (FullCreateIssueActionProperties & {
      storedActionData?: false;
    })
  | {
      storedActionData: true;
      actionDataS3Key: string;
    };

export type TransitionIssueActionProperties = {
  issueKey: string;
  statusName?: string;
  transitionName?: string;
};

type FullCreateIssueActionProperties = {
  project: JiraProjectKey;
  summary: string;
  classification: IssueTypeName;
  additionalFields?: IssueFields;
};

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
  jiraClient: JiraClient,
  s3Client: S3,
  action: { properties: CreateIssueActionProperties; [k: string]: any },
): Promise<Issue> {
  const actionProperties = action.properties.storedActionData
    ? await getStoredActionData(s3Client, action.properties.actionDataS3Key)
    : action.properties;

  const {
    summary,
    classification: issueTypeName,
    project,
    additionalFields,
  } = actionProperties;

  const projectId = await getProjectIdForProjectKey(jiraClient, project);

  // Check to see if description is too long, if it is, strip it out and put a placeholder
  // in
  const descriptionOverCharacterLimit = isDescriptionOverCharacterLimit(
    jiraClient.apiVersion,
    additionalFields,
  );

  const {
    description: additionalFieldsDescription,
    ...additionalFieldsWithoutDescription
  } = additionalFields ?? {};

  const newIssue = await jiraClient.addNewIssue({
    summary,
    projectId,
    issueTypeName,
    additionalFields: normalizeIssueFields(
      jiraClient.apiVersion,
      // Create the issue without a description if the description is over the character limit
      descriptionOverCharacterLimit
        ? {
            ...additionalFieldsWithoutDescription,
            description: DESCRIPTION_WHEN_TOO_LONG,
          }
        : additionalFields,
    ),
  });

  if (descriptionOverCharacterLimit) {
    // We need to take the description that was too long for the description field, and upload it as an
    // attachment to the issue we just created
    await jiraClient.addAttachmentOnIssue({
      issueId: newIssue.id,
      attachmentContent: getAttachmentContentFromDescription(
        additionalFieldsDescription,
      ),
    });
  }

  // return the issue
  return jiraClient.findIssue(newIssue.key);
}

export async function transitionJiraIssue(
  jiraClient: JiraClient,
  action: { properties: TransitionIssueActionProperties; [k: string]: any },
): Promise<Issue> {
  const { issueKey: issueId, statusName, transitionName } = action.properties;

  await jiraClient.transitionIssue({ issueId, statusName, transitionName });

  return jiraClient.findIssue(issueId);
}

function isValidCreateIssueActionProperties(
  actionProperties: any,
): actionProperties is FullCreateIssueActionProperties {
  if (!actionProperties) {
    return false;
  }
  const { project, summary, classification } = actionProperties;
  return !!project && !!summary && !!classification;
}

async function getStoredActionData(
  s3Client: S3,
  actionDataS3Key: string,
): Promise<FullCreateIssueActionProperties> {
  if (!jupiteroneEnv) {
    throw new Error('Environment variable JUPITERONE_ENVIRONMENT must be set.');
  }
  const { Body: s3ObjectBody } = await s3Client
    .getObject({
      Bucket: `${jupiteroneEnv}-${jiraActionsBucket}`,
      Key: actionDataS3Key,
    })
    .promise();

  if (!s3ObjectBody) {
    throw new Error('Could not fetch action data.');
  }

  const actionProperties = JSON.parse(
    s3ObjectBody.toString('utf-8'),
  ) as unknown;
  if (!isValidCreateIssueActionProperties(actionProperties)) {
    throw new Error(
      'Fetched action data does not contain expected properties.',
    );
  }
  return actionProperties;
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

function isDescriptionOverCharacterLimit(
  apiVersion: JiraApiVersion,
  issueFields: IssueFields | undefined,
): boolean {
  if (!issueFields) {
    // If no fields, can't be over the character limit
    return false;
  }

  const { description } = issueFields;

  if (!description) {
    // If no description, can't be over the character limit
    return false;
  }

  const normalizedDescription = getNormalizedDescription(
    apiVersion,
    description,
  );

  // The normalized description is of type any, so we need to make sure we convert
  // it to a string before doing any string length calculations
  const stringifiedDescription = JSON.stringify(normalizedDescription);
  // Need to be very defensive here since it is all typed as any
  if (!stringifiedDescription) {
    return false;
  }

  // There is a chance that since we are doing a stringify, it could add some filler characters
  // to the original string, and the input could actually be less than the threshold.  However,
  // since this is all typed as any (and could be ADF, JSON, Markdown, or a string), it is a trade-off
  // we have to be okay with.
  return stringifiedDescription.length >= ISSUE_DESCRIPTION_CHARACTER_LIMIT;
}

/**
 * Gets the correct version of the description based on the API version.
 * Can return ADF, Markdown, a string, or undefined
 */
function getNormalizedDescription(
  apiVersion: JiraApiVersion,
  description: IssueFields[keyof IssueFields],
) {
  const isADF = isAlertRulesDescriptionADF(description);
  if (isADF) {
    const alertRulesDescription = getAlertRulesDescription(description);
    if (apiVersion === '2') {
      return alertRulesDescription;
    }
    if (apiVersion === '3') {
      return markdownToADF(alertRulesDescription);
    }
  } else {
    // Support non-ADF description field
    if (apiVersion === '3') {
      return markdownToADF(description);
    }
  }
}

function normalizeIssueFields(
  apiVersion: JiraApiVersion,
  issueFields: IssueFields | undefined,
): IssueFields {
  const normalizedFields: IssueFields = { ...issueFields };
  const normalizedDescription = getNormalizedDescription(
    apiVersion,
    normalizedFields.description,
  );
  if (normalizedDescription) {
    normalizedFields.description = normalizedDescription;
  }

  return normalizedFields;
}

/**
 * Converts the passed in description into a format suitable for a JIRA
 * attachment.  The output needs to be a string, so this function takes
 * the different possible input formats for a description, and ensures
 * the output is String-like
 */
function getAttachmentContentFromDescription(description: any) {
  if (isAlertRulesDescriptionADF(description)) {
    // For ADF, just pull out the text from the ADF node
    return getAlertRulesDescription(description);
  } else {
    if (typeof description !== 'string') {
      // stringify all non-string objects
      return JSON.stringify(description);
    }
  }

  return description;
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
