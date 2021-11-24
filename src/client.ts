import {
  IntegrationLogger,
  IntegrationValidationError,
  IntegrationProviderAuthenticationError,
  IntegrationProviderAuthorizationError,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from './config';
import { createJiraClient } from './jira';
import JiraClient from './jira/JiraClient';
import { buildProjectConfigs } from './utils/builders';
import { User, Project, Issue } from './jira/types';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

//Jira documentation seems to indicate that max 100 replies will be returned per page
//Also, the number of replies per page is dynamically adjusted by Jira depending on how many
//fields are requested. Experiments show us getting 50 max per page in reality.
//However, we can always ask for more, and maybe they'll give them to us someday
const USERS_PAGE_SIZE = 200;
const ISSUES_PAGE_SIZE = 200;

const MAX_ISSUES_TO_INGEST = 2000; // may be overridden by config.bulkIngest boolean

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
   * Iterates each issue (Record) resource in Jira.
   * Note that the integration processes MAX_ISSUES_TO_INGEST issues
   * since last execution time
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateIssues(
    projectKey: string,
    lastJobTimestamp: number,
    iteratee: ResourceIteratee<Issue>,
  ): Promise<void> {
    let pagesProcessed = 0;
    let issuesProcessed = 0;
    let startAt: number = 0;
    let morePages: boolean = true;

    while (
      morePages &&
      (this.config.bulkIngest || issuesProcessed < MAX_ISSUES_TO_INGEST)
    ) {
      let issuesPage: Issue[] = [];
      try {
        issuesPage = await this.jira.fetchIssuesPage({
          project: projectKey,
          sinceAtTimestamp: lastJobTimestamp,
          startAt,
          pageSize: ISSUES_PAGE_SIZE,
        });
      } catch (err: any) {
        if (err.message.includes(`does not exist for the field 'project'.`)) {
          this.logger.warn(
            { projectKey },
            'Project key does not exist or you do not have access to pull down issues from this project.',
          );
          break;
          // This error is fine, just break from the loop
        } else {
          throw err;
        }
      }

      if (issuesPage.length === 0) {
        morePages = false;
      } else {
        issuesProcessed = issuesProcessed + issuesPage.length;
        for (const issue of issuesPage) {
          await iteratee(issue);
        }
      }

      this.logger.info(
        { pagesProcessed, issuesPageLength: issuesPage.length },
        'Fetched and processed page of issues',
      );

      startAt += issuesPage.length;
      pagesProcessed++;
    }

    if (!this.config.bulkIngest && issuesProcessed >= MAX_ISSUES_TO_INGEST) {
      this.logger.warn(
        { pagesProcessed, MAX_ISSUES_TO_INGEST },
        'Reached maximum number of issues; may not have pulled all issues since last execution.',
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
