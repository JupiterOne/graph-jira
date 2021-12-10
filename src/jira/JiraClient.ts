import JiraApi from 'jira-client';
import {
  IssuesOptions,
  IssueTypeName,
  JiraParams,
  PaginationOptions,
} from '../types';
import { Field, Issue, Project, ServerInfo, User } from './types';
import { retry, AttemptContext, sleep } from '@lifeomic/attempt';
import { IntegrationLogger } from '@jupiterone/integration-sdk-core';

export default class JiraClient {
  private client: JiraApi;
  private logger: IntegrationLogger;

  constructor(params: JiraParams, logger: IntegrationLogger) {
    const { host, username, password } = params;
    this.client = new JiraApi({
      protocol: 'https',
      host,
      username,
      password,
      apiVersion: '3',
      strictSSL: true,
    });
    this.logger = logger;
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

  public async findIssue(issueIdOrKey: string): Promise<Issue> {
    const issue: Issue = (await this.client.findIssue(issueIdOrKey)) as Issue;
    return issue;
  }

  public async fetchFields(): Promise<Field[]> {
    const fields: Field[] = (await this.client.listFields()) as Field[];
    return fields;
  }

  public async fetchProjects(): Promise<Project[]> {
    const projects = (await this.client.listProjects()) as Project[];
    return projects;
  }

  public async fetchServerInfo(): Promise<ServerInfo> {
    const info: ServerInfo = (await this.client.getServerInfo()) as ServerInfo;
    return info;
  }

  public async fetchIssuesPage({
    project,
    sinceAtTimestamp,
    startAt,
  }: IssuesOptions): Promise<Issue[]> {
    if (!project) {
      return [] as Issue[];
    }

    const projectQuery = `project='${project}'`;
    const sinceAtFilter = sinceAtTimestamp
      ? ` AND updated>=${sinceAtTimestamp}`
      : '';
    //'ORDER BY updated DESC' is default behavior for Issues
    //if we ever want to change it, one can order by other fields or sort ASC, just as in SQL
    const searchString = `${projectQuery}${sinceAtFilter}`;

    const functionToRetry = async () => {
      const response = await this.client.searchJira(searchString, {
        startAt: startAt || 0,
      });
      return response.issues as Promise<Issue[]>;
    };
    return rateAwareRetry(functionToRetry, this.logger) as Promise<Issue[]>;
  }

  public async fetchUsersPage(
    options: PaginationOptions = {},
  ): Promise<User[]> {
    const functionToRetry = async () => {
      return this.client.getUsers(
        options.startAt || 0,
        options.pageSize,
      ) as Promise<User[]>;
    };
    return rateAwareRetry(functionToRetry, this.logger) as Promise<User[]>;
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

async function rateAwareRetry(func, logger) {
  // Check https://github.com/lifeomic/attempt for options on retry
  return await retry(func, {
    maxAttempts: 5,
    delay: 500, //in msec
    jitter: true, // activates a random delay between minDelay and calculated exponential backoff
    minDelay: 5, // in msec
    factor: 2, //exponential backoff factor
    timeout: 120_000, // just in case the network process hangs
    async handleError(err: any, attemptContext: AttemptContext) {
      /* retry will keep trying to the limits of retryOptions
       * but it lets you intervene in this function - if you throw an error from in here,
       * it stops retrying. Otherwise you can just log the attempts.
       *
       * Jira has rate limits, but they are not per tenant
       * Instead, they issue a rate limit response to all clients when their servers are getting overloaded
       * therefore, there is no way to know when this might occur
       * Per https://developer.atlassian.com/cloud/jira/platform/rate-limiting/,
       * they try to provide a `Retry-After` header (in sec) in such cases
       * They might also provide a `Retry-After` in 5xx errors
       */

      // don't keep trying if it's not going to get better
      const statusCode = err.statusCode;
      if (
        err.retryable === false ||
        statusCode === 401 ||
        statusCode === 403 ||
        statusCode === 404 ||
        statusCode === 400
      ) {
        attemptContext.abort();
        logger.warn(
          { statusCode, attemptContext, err },
          `Hit an unrecoverable error in Jira API. Aborting.`,
        );
      } else {
        logger.warn(
          { statusCode: err.statusCode, attemptContext, err },
          `Hit a possibly recoverable error on Jira API. Waiting before trying again.`,
        );
      }

      const headers = err.response?.headers;
      const retryAfter = headers ? headers['retry-after]'] : undefined;
      if (Number.isInteger(retryAfter)) {
        if (retryAfter > 0 && retryAfter < 3600) {
          await sleep(retryAfter * 1000); // sleep expects msec ; retryAfter denoted in sec
        } else {
          logger.warn(
            retryAfter,
            'Retry-After header received with unreasonable value',
          );
        }
      }
    },
  });
}
