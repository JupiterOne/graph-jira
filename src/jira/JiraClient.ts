import JiraApi from 'jira-client';

import { IntegrationLogger } from '@jupiterone/integration-sdk-core';
import {
  AttemptContext,
  retry as attemptRetry,
  sleep,
} from '@lifeomic/attempt';

import { JiraClientConfig } from './';
import {
  Field,
  Issue,
  IssuesOptions,
  IssueTypeName,
  JiraApiVersion,
  PaginationOptions,
  Project,
  ServerInfo,
  User,
} from './types';

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

  public async addNewIssue(
    summary: string,
    projectId: number,
    issueTypeName: IssueTypeName,
    additionalFields: object = {},
  ): Promise<Issue> {
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
  public async projectKeyToProjectId(projectKey: string) {
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
        statusCode === 400
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
