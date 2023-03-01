import {
  createDirectRelationship,
  IntegrationInfoEventName,
  IntegrationLogger,
  IntegrationMissingKeyError,
  IntegrationStep,
  IntegrationStepExecutionContext,
  IntegrationWarnEventName,
  JobState,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { APIClient } from '../client';
import { IntegrationConfig } from '../config';
import { DATA_CONFIG_PROJECT_ENTITY_ARRAY } from '../constants';
import { createIssueEntity } from '../converters/IssueEntityConverter';
import {
  ISSUE_ENTITY_CLASS,
  ISSUE_ENTITY_TYPE,
  IssueEntity,
  PROJECT_ENTITY_TYPE,
  PROJECT_ISSUE_RELATIONSHIP_TYPE,
  ProjectEntity,
  USER_CREATED_ISSUE_RELATIONSHIP_TYPE,
  USER_ENTITY_TYPE,
  USER_REPORTED_ISSUE_RELATIONSHIP_TYPE,
  UserEntity,
} from '../entities';
import { Field, Issue, JiraProjectKey } from '../jira';
import { createApiClient, generateEntityKey } from '../utils';

/**
 * Maximum number of issues to ingest per project. This limit can be removed by
 * providing `instance.config.bulkIngestIssues: true`.
 *
 * Important: A change to the value of this constant must be reflected in
 * `docs/jupiterone.md`.
 */
const INGESTION_MAX_ISSUES_PER_PROJECT = 2000;

export async function fetchIssues({
  instance,
  logger,
  jobState,
  executionHistory,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const projectEntities = await jobState.getData<ProjectEntity[]>(
    DATA_CONFIG_PROJECT_ENTITY_ARRAY,
  );
  if (!projectEntities) {
    throw new IntegrationMissingKeyError(
      `Expected to find projectEntities in jobState.`,
    );
  }

  const config = instance.config;
  const { redactIssueDescriptions, apiVersion } = config;

  if (redactIssueDescriptions) {
    logger.info('Will redact descriptions for ingested jira_issue entities');
  }

  const lastJobTimestamp = executionHistory.lastSuccessful?.startedOn || 0;

  const apiClient = createApiClient(logger, config);
  const fieldsById = await fetchJiraFields(apiClient);

  const issueProcessor = async (projectKey: JiraProjectKey, issue: Issue) =>
    processIssue(
      {
        logger,
        jobState,
        fieldsById,
        customFieldsToInclude: config.customFields,
        projectEntities,
        redactIssueDescriptions,
        apiVersion,
      },
      projectKey,
      issue,
    );

  for (const projectKey of config.projects) {
    const projectIssueProcessor = async (issue: Issue) =>
      issueProcessor(projectKey, issue);
    if (config.bulkIngestIssues) {
      logger.info(
        {
          projectConfig: projectKey,
          bulkIngestIssues: config.bulkIngestIssues,
        },
        'Bulk issue ingestion is enabled',
      );
      logger.publishInfoEvent({
        name: IntegrationInfoEventName.Stats,
        description: 'Bulk issue ingestion is enabled',
      });
      await apiClient.iterateAllIssues(projectKey, projectIssueProcessor);
    } else {
      const allIssuesIngested = await apiClient.iterateIssues(
        projectKey,
        lastJobTimestamp,
        INGESTION_MAX_ISSUES_PER_PROJECT,
        projectIssueProcessor,
      );
      if (!allIssuesIngested) {
        logger.publishWarnEvent({
          name: IntegrationWarnEventName.IngestionLimitEncountered,
          description: `Issue Ingestion limit of ${INGESTION_MAX_ISSUES_PER_PROJECT} for project ${projectKey} was encountered. Not all issues were ingested. If there is a need to ingest all issues, please contact support so a bulk ingestion can be performed.`,
        });
      }
    }
  }
}

type IdFieldMap = { [id: string]: Field };

type ProcessIssueContext = {
  jobState: JobState;
  logger: IntegrationLogger;
  fieldsById: IdFieldMap;
  customFieldsToInclude: string[];
  projectEntities: ProjectEntity[];
  redactIssueDescriptions: boolean;
  apiVersion: string;
};

async function fetchJiraFields(apiClient: APIClient) {
  const fields = await apiClient.fetchFields();
  const fieldsById: IdFieldMap = {};
  for (const field of fields) {
    fieldsById[field.id] = field;
  }
  return fieldsById;
}

async function processIssue(
  {
    logger,
    jobState,
    customFieldsToInclude,
    fieldsById,
    projectEntities,
    redactIssueDescriptions,
    apiVersion,
  }: ProcessIssueContext,
  projectKey: JiraProjectKey,
  issue: Issue,
) {
  try {
    const issueEntity = (await jobState.addEntity(
      createIssueEntity({
        issue,
        logger,
        fieldsById,
        customFieldsToInclude,
        redactIssueDescriptions,
        apiVersion,
      }),
    )) as IssueEntity;
    const projectEntity = projectEntities?.find(
      (project) => project.key === projectKey,
    );

    if (projectEntity) {
      await jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: projectEntity,
          to: issueEntity,
        }),
      );
    } else {
      logger.warn(
        { projectKey },
        'Unable to create issue -> project relationship because the project was not in the job state',
      );
    }

    if (issue.fields.creator?.accountId) {
      const creatorUserKey = generateEntityKey(
        USER_ENTITY_TYPE,
        issue.fields.creator.accountId,
      );
      const creatorEntity = (await jobState.findEntity(
        creatorUserKey,
      )) as UserEntity;

      if (creatorEntity) {
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.CREATED,
            from: creatorEntity,
            to: issueEntity,
          }),
        );
      } else {
        logger.info(
          { creatorUserKey, issueName: issueEntity.name },
          '[SKIP] user_created_issue relationship, issue creator not found',
        );
      }
    }

    if (issue.fields.reporter?.accountId) {
      const reporterUserKey = generateEntityKey(
        USER_ENTITY_TYPE,
        issue.fields.reporter.accountId,
      );
      const reporterEntity = (await jobState.findEntity(
        reporterUserKey,
      )) as UserEntity;

      if (reporterEntity) {
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.REPORTED,
            from: reporterEntity,
            to: issueEntity,
          }),
        );
      } else {
        logger.info(
          { reporterUserKey, issueName: issueEntity.name },
          '[SKIP] user_reported_issue relationship, issue reporter not found',
        );
      }
    }
  } catch (err) {
    //if a single issue has an error in processing, just log it and continue 'cause we got a lotta things to do
    logger.warn(
      { err, issueId: issue.id },
      `Error encountered processing issue`,
    );
  }
}

export const issueSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-issues',
    name: 'Fetch Issues',
    entities: [
      {
        resourceName: 'Jira Issue',
        _type: ISSUE_ENTITY_TYPE,
        _class: ISSUE_ENTITY_CLASS,
        partial: true,
        indexMetadata: {
          enabled: false,
        },
      },
    ],
    relationships: [
      {
        _type: PROJECT_ISSUE_RELATIONSHIP_TYPE,
        _class: RelationshipClass.HAS,
        sourceType: PROJECT_ENTITY_TYPE,
        targetType: ISSUE_ENTITY_TYPE,
        partial: true,
      },
      {
        _type: USER_CREATED_ISSUE_RELATIONSHIP_TYPE,
        _class: RelationshipClass.CREATED,
        sourceType: USER_ENTITY_TYPE,
        targetType: ISSUE_ENTITY_TYPE,
        partial: true,
      },
      {
        _type: USER_REPORTED_ISSUE_RELATIONSHIP_TYPE,
        _class: RelationshipClass.REPORTED,
        sourceType: USER_ENTITY_TYPE,
        targetType: ISSUE_ENTITY_TYPE,
        partial: true,
      },
    ],
    dependsOn: ['fetch-projects', 'fetch-users'],
    executionHandler: fetchIssues,
  },
];
