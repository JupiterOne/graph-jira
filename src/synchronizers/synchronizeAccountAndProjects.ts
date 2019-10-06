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
  const accountEntity = await createAccountEntity(serverInfo);
  logger.debug({ projects }, "Creating entities for projects...");
  const projectEntities = await createProjectEntities(projects);

  const accountProjectRelationships = createAccountProjectRelationships(
    serverInfo,
    projects,
  );

  const entityOperations = [
    ...persister.processEntities(existingAccountEntity, [accountEntity]),
    ...persister.processEntities(existingProjectEntities, projectEntities),
  ];

  const relationshipOperations = [
    ...persister.processRelationships(
      existingAccountProjectRelationships,
      accountProjectRelationships,
    ),
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
