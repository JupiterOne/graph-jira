import {
  createDirectRelationship,
  IntegrationMissingKeyError,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from '../config';
import {
  DATA_CONFIG_PROJECT_ENTITY_ARRAY,
  IngestionSources,
  Steps,
} from '../constants';
import { createProjectEntity } from '../converters/ProjectEntityConverter';
import {
  ACCOUNT_ENTITY_TYPE,
  ACCOUNT_PROJECT_RELATIONSHIP_TYPE,
  AccountEntity,
  PROJECT_ENTITY_CLASS,
  PROJECT_ENTITY_TYPE,
  ProjectEntity,
} from '../entities';
import { createApiClient } from '../utils';
import { DATA_ACCOUNT_ENTITY } from './account';

export async function fetchProjects({
  instance,
  logger,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const config = instance.config;
  const apiClient = createApiClient(logger, config);

  const accountEntity =
    await jobState.getData<AccountEntity>(DATA_ACCOUNT_ENTITY);
  if (!accountEntity) {
    throw new IntegrationMissingKeyError(
      `Expected to find Account entity in jobState`,
    );
  }

  const projectEntities: ProjectEntity[] = [];

  await apiClient.iterateProjects(async (project) => {
    const projectEntity = (await jobState.addEntity(
      createProjectEntity(project),
    )) as ProjectEntity;

    if (config.projects.includes(projectEntity.key)) {
      projectEntities.push(projectEntity);
    }
    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: projectEntity,
      }),
    );
  });

  await jobState.setData(DATA_CONFIG_PROJECT_ENTITY_ARRAY, projectEntities);
}

export const projectSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: Steps.PROJECTS,
    name: 'Fetch Projects',
    ingestionSourceId: IngestionSources.PROJECTS,
    entities: [
      {
        resourceName: 'Jira Project',
        _type: PROJECT_ENTITY_TYPE,
        _class: PROJECT_ENTITY_CLASS,
      },
    ],
    relationships: [
      {
        _type: ACCOUNT_PROJECT_RELATIONSHIP_TYPE,
        _class: RelationshipClass.HAS,
        sourceType: ACCOUNT_ENTITY_TYPE,
        targetType: PROJECT_ENTITY_TYPE,
      },
    ],
    dependsOn: [Steps.ACCOUNT],
    executionHandler: fetchProjects,
  },
];
