import {
    IntegrationLogger,
    IntegrationValidationError,
    IntegrationProviderAuthenticationError,
} from '@jupiterone/integration-sdk-core';
  
import { IntegrationConfig } from './config';
import { createJiraClient } from './jira';
import JiraClient from './jira/JiraClient';
import { buildProjectConfigs } from './utils/builders';
import { 
  User,
  Project,
  Issue,
} from './jira/types';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

const USERS_PAGE_SIZE = Number(process.env.USERS_PAGE_SIZE) || 200;
const USERS_PAGE_LIMIT = Number(process.env.USERS_PAGE_LIMIT) || 10;
const ISSUES_PAGE_SIZE = Number(process.env.USERS_PAGE_SIZE) || 200;
const ISSUES_PAGE_LIMIT = Number(process.env.USERS_PAGE_LIMIT) || 10;

/**
 * An APIClient maintains authentication state and provides an interface to
 * third party data APIs.
 *
 * It is recommended that integrations wrap provider data APIs to provide a
 * place to handle error responses and implement common patterns for iterating
 * resources.
 */
export class APIClient {
  jira: JiraClient;
  constructor(
    readonly config: IntegrationConfig,
    readonly logger: IntegrationLogger,
  ) {
      this.jira = createJiraClient(config);
  }

  public async verifyAuthentication(): Promise<void> {
    // the most light-weight request possible to validate
    // authentication works with the provided credentials, throw an err if
    // authentication fails
    let fetchedProjectKeys: string[];
    try {
      const fetchedProjects = await this.jira.fetchProjects();
      fetchedProjectKeys = fetchedProjects.map(p => p.key);
    } catch (err) {
      throw new IntegrationProviderAuthenticationError(err);
    }
  
    const configProjectKeys = buildProjectConfigs(this.config.projects).map(
      p => p.key,
    );
  
    const invalidConfigProjectKeys = configProjectKeys.filter(
      k => !fetchedProjectKeys.includes(k),
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
  public async iterateUsers(
    iteratee: ResourceIteratee<User>,
  ): Promise<void> {

    let pagesProcessed = 0;
    let startAt: number = 0;
    let users: User[] = [];

    while (pagesProcessed < USERS_PAGE_LIMIT) {
      const usersPage = await this.jira.fetchUsersPage({
        startAt,
        pageSize: USERS_PAGE_SIZE,
      });

      if (usersPage.length === 0) {
        break;
      } else {
        users = users.concat(usersPage);
      }

      this.logger.info(
        { pagesProcessed, usersPageLength: usersPage.length },
        "Fetched page of users",
      );

      startAt += usersPage.length;
      pagesProcessed++;
    }

    for (const user of users) {
      await iteratee(user);
    }
  }

  /**
   * Iterates each issue (Record) resource in Jira.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateIssues(
    projectKey: string,
    lastJobTimestamp: number,
    iteratee: ResourceIteratee<Issue>,
  ): Promise<void> {

    let pagesProcessed = 0;
    let startAt: number = 0;
    let issues: Issue[] = [];
  
    while (pagesProcessed < ISSUES_PAGE_LIMIT) {
      const issuesPage = await this.jira.fetchIssuesPage({
        project: projectKey,
        sinceAtTimestamp: lastJobTimestamp,
        startAt,
        pageSize: ISSUES_PAGE_SIZE,
      });
  
      if (issuesPage.length === 0) {
        break;
      } else {
        issues = issues.concat(issuesPage);
      }

      this.logger.info(
        { pagesProcessed, issuesPageLength: issuesPage.length },
        "Fetched page of issues",
      );

      startAt += issuesPage.length;
      pagesProcessed++;
    }
      
    for (const issue of issues) {
      await iteratee(issue);
    }
  }

}

export function createAPIClient(
  config: IntegrationConfig,
  logger: IntegrationLogger,
): APIClient {
  return new APIClient(config, logger);
}