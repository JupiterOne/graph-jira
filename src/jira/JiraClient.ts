import JiraApi from 'jira-client';

import { IntegrationLogger } from '@jupiterone/integration-sdk-core';
import {
  AttemptContext,
  retry as attemptRetry,
  sleep,
} from '@lifeomic/attempt';

import util from 'util';

import { JiraClientConfig } from './';
import {
  Field,
  Issue,
  IssueFields,
  IssuesOptions,
  IssueTransition,
  IssueTypeName,
  JiraApiVersion,
  JiraProjectId,
  JiraProjectKey,
  PaginationOptions,
  Project,
  ServerInfo,
  User,
} from './types';
import FormData from 'form-data';
import fs from 'fs';

type AddNewIssueParams = {
  summary: string;
  projectId: number;
  issueTypeName: IssueTypeName;
  additionalFields?: IssueFields;
};

// This is necessary due to the fact that in node-10, writeFile does not have an async version
const writeFileAsync = util.promisify(fs.writeFile);
const unlinkFileAsync = util.promisify(fs.unlink);

const JIRA_ATTACHMENT_FILENAME = 'jupiterone-content';
const JIRA_ATTACHMENT_FILETYPE = 'txt';

/**
 * An adapter for `JiraApi` serving to handle differences in Jira API and server
 * versions and provide an interface for pagination.
 *
 * The JiraApi accepts a `version` option that alters resource URLs to include
 * the version number (i.e. `/rest/api/2/users`, `/rest/api/3/users`). However,
 * there are [different versions of Jira][1] out there, each supporting API V2
 * to some degree or other.
 *
 * [1]: https://docs.atlassian.com/software/jira/docs/api/REST/
 */
export class JiraClient {
  public apiVersion: JiraApiVersion;

  private client: JiraApi;

  constructor(private logger: IntegrationLogger, config: JiraClientConfig) {
    this.apiVersion = config.apiVersion;
    this.client = new JiraApi(config);
  }

  /**
   * Add a new issue to the specified project.
   *
   * Jira API 3 supports a complex JSON structure (Atlassian Document Format)
   * for some properties. It is currently the responsibility of the code calling
   * this function to provide the propery values for these `additionalFields`.
   */
  public async addNewIssue({
    summary,
    projectId,
    issueTypeName,
    additionalFields = {},
  }: AddNewIssueParams): Promise<Issue> {
    const issue: Issue = (await this.client.addNewIssue({
      fields: {
        summary,
        project: {
          id: projectId,
        },
        issuetype: {
          name: issueTypeName,
        },
        ...additionalFields,
      },
    })) as Issue;
    return issue;
  }

  public async addAttachmentOnIssue({
    issueId,
    attachmentContent,
  }): Promise<void> {
    const filePath = `/tmp/${JIRA_ATTACHMENT_FILENAME}-${issueId}.${JIRA_ATTACHMENT_FILETYPE}`;
    await writeFileAsync(filePath, attachmentContent);
    const form = new FormData();
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    const fileStream = fs.createReadStream(filePath);

    form.append('file', fileStream, { knownLength: fileSizeInBytes });

    try {
      await this.client.addAttachmentOnIssue(issueId, fileStream);
    } catch (error) {
      this.logger.error(
        { filePath, error },
        'Error adding attachment to issue',
      );
    }

    try {
      await unlinkFileAsync(filePath);
    } catch (error) {
      this.logger.error(
        { filePath, error },
        'Error removing temp file from lambda container',
      );
    }
    // Consider returning  better type, but the docs are bad and dont help
  }

  public async transitionIssue({
    issueId,
    statusName,
    transitionName,
  }: {
    issueId: string;
    statusName?: string; // name of status to transition to
    transitionName?: string;
  }): Promise<void> {
    // either statusName or transitionName is needed, but not both
    if ((!statusName && !transitionName) || (statusName && transitionName)) {
      throw new Error(`Only one of statusName or transitionName is required`);
    }
    const issue = (await this.client.findIssue(
      issueId,
      'transitions', // includes possible transitions for current issue status
    )) as Issue & { transitions: IssueTransition[] };
    const transition = issue.transitions.find((transition) =>
      statusName
        ? transition.to.name === statusName
        : transition.name === transitionName,
    );
    if (!transition) {
      if (statusName) {
        throw new Error(
          `Unable to find transition for issue ${issueId} to status "${statusName}"`,
        );
      }
      if (transitionName) {
        throw new Error(
          `Unable to find transition for issue ${issueId} named "${transitionName}"`,
        );
      }
    }
    try {
      await this.client.transitionIssue(issueId, { transition });
    } catch (error) {
      this.logger.error(
        { issueId, error, transition },
        'Error transitioning issue',
      );
    }
  }

  public async getCurrentUser(): Promise<any> {
    return await this.client.getCurrentUser();
  }

  public async findIssue(issueIdOrKey: string): Promise<Issue> {
    return (await this.client.findIssue(issueIdOrKey)) as Issue;
  }

  public async fetchFields(): Promise<Field[]> {
    return (await this.client.listFields()) as Field[];
  }

  public async fetchProjects(): Promise<Project[]> {
    return (await this.client.listProjects()) as Project[];
  }

  public async fetchServerInfo(): Promise<ServerInfo> {
    return (await this.client.getServerInfo()) as ServerInfo;
  }

  public async fetchIssuesPage({
    project,
    sinceAtTimestamp,
    startAt,
    pageSize,
  }: IssuesOptions): Promise<Issue[]> {
    const projectQuery = `project='${project}'`;
    const sinceAtFilter = sinceAtTimestamp
      ? ` AND updated>=${sinceAtTimestamp}`
      : '';
    //'ORDER BY updated DESC' is default behavior for Issues
    //if we ever want to change it, one can order by other fields or sort ASC, just as in SQL
    const searchString = `${projectQuery}${sinceAtFilter}`;

    return retry(this.logger, async () => {
      const response = await this.client.searchJira(searchString, {
        startAt: startAt,
        maxResults: pageSize,
      });
      return response.issues as Promise<Issue[]>;
    });
  }

  public async fetchUsersPage(options?: PaginationOptions): Promise<User[]> {
    return retry(this.logger, async () => {
      if (this.apiVersion === '3') {
        return this.client.getUsers(
          options?.startAt,
          options?.pageSize,
        ) as Promise<User[]>;
      } else if (this.apiVersion === '2') {
        // Tested with Jira server 8.20.3
        // https://docs.atlassian.com/software/jira/docs/api/REST/8.20.1/#user-findUsers
        return this.client.searchUsers({
          startAt: options?.startAt,
          maxResults: options?.pageSize,
          username: '.',
          query: '',
        }) as Promise<User[]>;
      } else {
        throw new Error(`Unknown Jira API version: ${this.apiVersion}`);
      }
    });
  }

  /**
   * Converts a Jira project key to a Jira project id.
   *
   * e.g. TEST -> 12345
   */
  public async projectKeyToProjectId(
    projectKey: JiraProjectKey,
  ): Promise<JiraProjectId> {
    const project: Project = (await this.client.getProject(
      projectKey,
    )) as Project;
    return Number(project.id);
  }
}

/**
 * Retry request functions when HTTP responses (status codes and retry/rate
 * limit response headers) indicate another attempt may succeed.
 *
 * Jira APIs have dynamic rate limits communicated as response headers. In cases
 * where the error is not known to be fatal and a `Retry-After` header is
 * provided, the function will sleep so the next request is delayed.
 *
 * @see https://developer.atlassian.com/cloud/jira/platform/rate-limiting/
 */
async function retry<T>(logger: IntegrationLogger, func: () => Promise<T[]>) {
  return await attemptRetry(func, {
    maxAttempts: 5,
    delay: 500,
    jitter: true,
    minDelay: 5,
    factor: 2,

    // Prevent eternal hanging bug in lifeomic/attempt, see
    // https://github.com/lifeomic/attempt/blob/4d493ab628984fde1452983d2a121c7ef255986d/src/index.ts#L193
    timeout: 120_000,

    async handleError(err: any, attemptContext: AttemptContext) {
      const statusCode = err.statusCode;
      if (
        err.retryable === false || // TODO: what sets this property on err?
        statusCode === 401 ||
        statusCode === 403 ||
        statusCode === 404 ||
        statusCode === 400 ||
        statusCode === 500
      ) {
        attemptContext.abort();
        logger.info(
          { statusCode, attemptContext, err },
          'Request error appears to be fatal, aborting retries...',
        );
      }

      if (attemptContext.attemptsRemaining > 0) {
        const retryAfterSeconds = err.response?.headers?.['retry-after'];
        if (Number.isInteger(retryAfterSeconds)) {
          if (retryAfterSeconds > 0 && retryAfterSeconds < 3600) {
            logger.info(
              {
                statusCode,
                attemptContext,
                err,
                retryAfterSeconds,
              },
              'Request error appears to be temporary, waiting to retry...',
            );
            await sleep(retryAfterSeconds * 1000);
          }
        }
      }
    },
  });
}
