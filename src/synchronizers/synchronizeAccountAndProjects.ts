import {
  IntegrationExecutionResult,
  summarizePersisterOperationsResults,
} from "@jupiterone/jupiter-managed-integration-sdk";

import {
  createAccountEntity,
  createAccountProjectRelationships,
  createProjectEntities,
} from "../converters";
import * as Entities from "../entities";
import { JiraIntegrationContext } from "../types";

export default async function(
  executionContext: JiraIntegrationContext,
): Promise<IntegrationExecutionResult> {
  const { jira, graph, persister, logger } = executionContext;

  const existingAccountEntity = await graph.findEntitiesByType<
    Entities.AccountEntity
  >(Entities.ACCOUNT_ENTITY_TYPE);
  const existingProjectEntities = await graph.findEntitiesByType<
    Entities.ProjectEntity
  >(Entities.PROJECT_ENTITY_TYPE);

  const existingAccountProjectRelationships = await graph.findRelationshipsByType<
    Entities.AccountProjectRelationship
  >(Entities.ACCOUNT_PROJECT_RELATIONSHIP_TYPE);

  const [serverInfo, projects] = await Promise.all([
    jira.fetchServerInfo(),
    jira.fetchProjects(),
  ]);

  logger.debug({ serverInfo }, "Creating entity for serverInfo...");
  const accountEntity = createAccountEntity(serverInfo);
  logger.debug({ projects }, "Creating entities for projects...");
  const projectEntities = createProjectEntities(projects);

  const accountProjectRelationships = createAccountProjectRelationships(
    serverInfo,
    projects,
  );

  const entityOperations = [
    ...persister.processEntities({
      oldEntities: existingAccountEntity,
      newEntities: [accountEntity],
    }),
    ...persister.processEntities({
      oldEntities: existingProjectEntities,
      newEntities: projectEntities,
    }),
  ];

  const relationshipOperations = [
    ...persister.processRelationships({
      oldRelationships: existingAccountProjectRelationships,
      newRelationships: accountProjectRelationships,
    }),
  ];

  return {
    operations: summarizePersisterOperationsResults(
      await persister.publishPersisterOperations([
        entityOperations,
        relationshipOperations,
      ]),
    ),
  };
}
