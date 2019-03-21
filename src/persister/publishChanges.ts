import {
  EntityFromIntegration,
  EntityOperation,
  PersisterClient,
  RelationshipOperation,
} from "@jupiterone/jupiter-managed-integration-sdk";

import {
  createAccountEntity,
  createAccountProjectRelationships,
  createIssueCreatedByUserRelationships,
  createIssueEntities,
  createIssueReportedByUserRelationships,
  createProjectEntities,
  createProjectIssueRelationships,
  createUserEntities,
} from "../converters";

import { JiraDataModel } from "../jira";
import {
  JupiterOneDataModel,
  JupiterOneEntitiesData,
  JupiterOneRelationshipsData,
} from "../jupiterone";

type EntitiesKeys = keyof JupiterOneEntitiesData;
type RelationshipsKeys = keyof JupiterOneRelationshipsData;

export default async function publishChanges(
  persister: PersisterClient,
  oldData: JupiterOneDataModel,
  jiraData: JiraDataModel,
) {
  const newData = convert(jiraData);

  const entities = createEntitiesOperations(
    oldData.entities,
    newData.entities,
    persister,
  );
  const relationships = createRelationshipsOperations(
    oldData.relationships,
    newData.relationships,
    persister,
  );

  return await persister.publishPersisterOperations([entities, relationships]);
}

function createEntitiesOperations(
  oldData: JupiterOneEntitiesData,
  newData: JupiterOneEntitiesData,
  persister: PersisterClient,
): EntityOperation[] {
  const defatultOperations: EntityOperation[] = [];
  const entities: EntitiesKeys[] = Object.keys(oldData) as EntitiesKeys[];

  return entities.reduce((operations, entityName) => {
    const oldEntities = oldData[entityName];
    const newEntities = newData[entityName];

    return [
      ...operations,
      ...persister.processEntities<EntityFromIntegration>(
        oldEntities,
        newEntities,
      ),
    ];
  }, defatultOperations);
}

function createRelationshipsOperations(
  oldData: JupiterOneRelationshipsData,
  newData: JupiterOneRelationshipsData,
  persister: PersisterClient,
): RelationshipOperation[] {
  const defatultOperations: RelationshipOperation[] = [];
  const relationships: RelationshipsKeys[] = Object.keys(
    oldData,
  ) as RelationshipsKeys[];

  return relationships.reduce((operations, relationshipName) => {
    const oldRelationhips = oldData[relationshipName];
    const newRelationhips = newData[relationshipName];

    return [
      ...operations,
      ...persister.processRelationships(oldRelationhips, newRelationhips),
    ];
  }, defatultOperations);
}

export function convert(jiraData: JiraDataModel): JupiterOneDataModel {
  return {
    entities: convertEntities(jiraData),
    relationships: convertRelationships(jiraData),
  };
}

export function convertEntities(
  jiraData: JiraDataModel,
): JupiterOneEntitiesData {
  return {
    accounts: [createAccountEntity(jiraData.serverInfo)],
    projects: createProjectEntities(jiraData.projects),
    users: createUserEntities(jiraData.users),
    issues: createIssueEntities(jiraData.issues),
  };
}

export function convertRelationships(
  jiraData: JiraDataModel,
): JupiterOneRelationshipsData {
  return {
    accountProjectRelationships: createAccountProjectRelationships(
      jiraData.serverInfo,
      jiraData.projects,
    ),
    projectIssueRelationships: createProjectIssueRelationships(
      jiraData.projects,
      jiraData.issues,
    ),
    issueCreatedByUserRelationships: createIssueCreatedByUserRelationships(
      jiraData.issues,
      jiraData.users,
    ),
    issueReportedByUserRelationships: createIssueReportedByUserRelationships(
      jiraData.issues,
      jiraData.users,
    ),
  };
}
