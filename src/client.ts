import {
  IntegrationLogger,
  IntegrationProviderAuthenticationError,
  IntegrationProviderAuthorizationError,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from './config';
import {
  createJiraClient,
  Issue,
  IssuesOptions,
  JiraClient,
  Project,
  User,
} from './jira';
import { buildProjectConfigs } from './utils/builders';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

/**
 * Number of users to fetch per page, set to maximum currently allowed.
 */
const USERS_PAGE_SIZE = 100;

/**
 * Number of issues to fetch per page, set to maximum currently allowed.
 */
const ISSUES_PAGE_SIZE = 100;

export class APIClient {
  jira: JiraClient;
  constructor(
    readonly config: IntegrationConfig,
    readonly logger: IntegrationLogger,
  ) {
    this.jira = createJiraClient(config, logger);
  }

  public async verifyAuthentication(): Promise<void> {
    // the most light-weight request possible to validate
    // authentication works with the provided credentials, throw an err if
    // authentication fails
    let fetchedProjectKeys: string[];
    try {
      const fetchedProjects = await this.jira.fetchProjects();
      fetchedProjectKeys = fetchedProjects.map((p) => p.key);
    } catch (err) {
      throw new IntegrationProviderAuthenticationError(err);
    }

    const configProjectKeys = buildProjectConfigs(this.config.projects).map(
      (p) => p.key,
    );

    const invalidConfigProjectKeys = configProjectKeys.filter(
      (k) => !fetchedProjectKeys.includes(k),
    );
    if (invalidConfigProjectKeys.length) {
      throw new IntegrationValidationError(
        `The following project key(s) are invalid: ${JSON.stringify(
          invalidConfigProjectKeys,
        )}. Ensure the authenticated user has access to this project.`,
      );
    }
  }

  /**
   * Iterates each project resource in Jira.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateProjects(
    iteratee: ResourceIteratee<Project>,
  ): Promise<void> {
    const projects: Project[] = await this.jira.fetchProjects();
    for (const project of projects) {
      await iteratee(project);
    }
  }

  /**
   * Iterates each user resource in Jira.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(iteratee: ResourceIteratee<User>): Promise<void> {
    let pagesProcessed = 0;
    let startAt: number = 0;
    let morePages: boolean = true;

    while (morePages) {
      let usersPage: User[] = [];
      try {
        usersPage = await this.jira.fetchUsersPage({
          startAt,
          pageSize: USERS_PAGE_SIZE,
        });
      } catch (err: any) {
        if (err?.statusCode === 403) {
          throw new IntegrationProviderAuthorizationError({
            cause: err,
            status: err.statusCode,
            statusText: err.name,
            endpoint: 'fetchUsersPage',
          });
        }
      }

      if (usersPage.length === 0) {
        morePages = false;
      } else {
        for (const user of usersPage) {
          await iteratee(user);
        }
      }

      this.logger.info(
        { pagesProcessed, usersPageLength: usersPage.length },
        'Fetched and processed page of users',
      );

      startAt += usersPage.length;
      pagesProcessed++;
    }
  }

  /**
   * Iterates a limited number of issues in a Jira project. This can be used for
   * periodic processing to follow changes over time. Use `iterateAllIssues` to
   * process everything.
   *
   * @param project the Jira project key to fetch issues from
   * @param sinceAtTimestamp limits ingestion to issues updated since this time;
   * `0` will fetch most recently modified first (descending time order)
   * @param maxIssues limits ingestion to a maximum number of issues,
   * particularly necessary for `sinceAtTimestamp: 0`
   * @param iteratee receives each issue to produce entities/relationships
   */
  public async iterateIssues(
    project: string,
    sinceAtTimestamp: number,
    maxIssues: number,
    iteratee: ResourceIteratee<Issue>,
  ): Promise<void> {
    let issuesProcessed = 0;

    await this.paginateIssues(
      {
        project,
        sinceAtTimestamp,
      },
      async (issues) => {
        for (const issue of issues) {
          await iteratee(issue);
        }
        issuesProcessed += issues.length;
        return issuesProcessed < maxIssues;
      },
    );

    if (issuesProcessed >= maxIssues) {
      this.logger.info(
        { issuesProcessed, maxIssues, sinceAtTimestamp },
        'Reached maximum number of issues; may not have pulled all issues modified since timestamp.',
      );
    }
  }

  /**
   * Iterates each and every issue in a Jira project. This can be used for bulk
   * processing. Use `iterateIssues` to limit processing.
   *
   * @param project the Jira project key to fetch issues from
   * @param iteratee receives each issue to produce entities/relationships
   */
  public async iterateAllIssues(
    project: string,
    iteratee: ResourceIteratee<Issue>,
  ): Promise<void> {
    await this.paginateIssues(
      {
        project,
      },
      async (issues) => {
        for (const issue of issues) {
          await iteratee(issue);
        }
      },
    );
  }

  private async paginateIssues(
    issuesOptions: IssuesOptions,
    iteratee: (issues: Issue[]) => Promise<boolean | void>,
  ): Promise<void> {
    let pagesProcessed = 0;
    let issuesProcessed = 0;
    let startAt = 0;
    let morePages = true;
    let continueProcessing = true;

    while (morePages && continueProcessing) {
      let issuesPage: Issue[] = [];
      try {
        issuesPage = await this.jira.fetchIssuesPage({
          ...issuesOptions,
          startAt,
          pageSize: ISSUES_PAGE_SIZE,
        });
      } catch (err: any) {
        if (err.message.includes(`does not exist for the field 'project'.`)) {
          this.logger.info(
            { project: issuesOptions.project },
            'Project key does not exist or permissions do not allow access to issues.',
          );
          break;
        } else {
          throw err;
        }
      }

      if (issuesPage.length === 0) {
        morePages = false;
      } else {
        continueProcessing = (await iteratee(issuesPage)) !== false;
        issuesProcessed = issuesProcessed + issuesPage.length;
      }

      pagesProcessed++;
      startAt += issuesPage.length;

      this.logger.info(
        {
          pageLength: issuesPage.length,
          pagesProcessed,
          issuesProcessed,
          morePages,
          continueProcessing,
        },
        'Fetched and processed page of issues',
      );
    }
  }
}

export function createAPIClient(
  config: IntegrationConfig,
  logger: IntegrationLogger,
): APIClient {
  return new APIClient(config, logger);
}
