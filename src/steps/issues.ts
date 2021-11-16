import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  createDirectRelationship,
  IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig } from '../config';
import { DATA_CONFIG_PROJECT_ENTITY_ARRAY } from '../constants';
import { createIssueEntity } from '../converters/IssueEntityConverter';
import {
  PROJECT_ISSUE_RELATIONSHIP_TYPE,
  PROJECT_ENTITY_TYPE,
  ProjectEntity,
  ISSUE_ENTITY_TYPE,
  ISSUE_ENTITY_CLASS,
  IssueEntity,
  USER_ENTITY_TYPE,
  USER_CREATED_ISSUE_RELATIONSHIP_TYPE,
  USER_REPORTED_ISSUE_RELATIONSHIP_TYPE,
  UserEntity,
} from '../entities';
import { Field } from '../jira';
import { buildCustomFields, buildProjectConfigs } from '../utils/builders';
import generateEntityKey from '../utils/generateEntityKey';

export async function fetchIssues({
  instance,
  logger,
  jobState,
  executionHistory,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const config = instance.config;
  const apiClient = createAPIClient(config, logger);

  const projectConfigs = buildProjectConfigs(instance.config.projects);

  const projectEntities = await jobState.getData<ProjectEntity[]>(
    DATA_CONFIG_PROJECT_ENTITY_ARRAY,
  );
  if (!projectEntities) {
    throw new IntegrationMissingKeyError(
      `Expected to find projectEntities in jobState.`,
    );
  }

  //used in creation of issue
  const fields = await apiClient.jira.fetchFields();
  const fieldsById: { [id: string]: Field } = {};
  for (const field of fields) {
    fieldsById[field.id] = field;
  }

  //if configured, used in creation of issue
  const customFieldsToInclude = buildCustomFields(
    instance.config.customFields, //okay if falsy
  );

  const lastJobTimestamp = executionHistory.lastSuccessful?.startedOn || 0;
  for (const projectConfig of projectConfigs) {
    //do not confuse projectEntity._key with projectEntity.key. They are different here.
    await apiClient.iterateIssues(
      projectConfig.key,
      lastJobTimestamp,
      async (issue) => {
        try {
          const issueEntity = (await jobState.addEntity(
            createIssueEntity({
              issue,
              logger,
              fieldsById,
              customFieldsToInclude,
            }),
          )) as IssueEntity;

          const projectEntity = projectEntities?.find(
            (project) => project.key === projectConfig.key,
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
              { projectKey: projectConfig.key },
              'Unable to create issue -> project relationship because the project was not in the job state',
            );
          }

          if (issue.fields.creator && issue.fields.creator.accountId) {
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
              logger.warn(
                { creatorUserKey, issueName: issueEntity.name },
                'Created user is no longer in this Jira instance. Not creating user_created_issue relationship.',
              );
            }
          }

          if (issue.fields.reporter && issue.fields.reporter.accountId) {
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
              logger.warn(
                { reporterUserKey, issueName: issueEntity.name },
                'Reported user is no longer in this Jira instance. Not creating user_reported_issue relationship.',
              );
            }
          }
        } catch (err) {
          //if a single issue has an error in processing, just log it and continue 'cause we got a lotta things to do
          logger.warn(err, `Error encountered on issue ${issue.id}`);
        }
      },
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
