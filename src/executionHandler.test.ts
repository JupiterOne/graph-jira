import {
  IntegrationActionName,
  IntegrationExecutionContext,
  PersisterClient,
} from "@jupiterone/jupiter-managed-integration-sdk";

import executionHandler from "./executionHandler";
import { createJiraClient } from "./jira";
import JiraClient from "./jira/JiraClient";

jest.mock("./jira");

const clients = {
  graph: {
    findEntitiesByType: jest.fn().mockResolvedValue([]),
    findRelationshipsByType: jest.fn().mockResolvedValue([]),
  },
  persister: {
    processEntities: jest.fn().mockReturnValue([]),
    processRelationships: jest.fn().mockReturnValue([]),
    publishEntityOperations: jest.fn().mockResolvedValue({}),
    publishRelationshipOperations: jest.fn().mockResolvedValue({}),
    publishPersisterOperations: jest.fn().mockResolvedValue({}),
  } as PersisterClient,
  integrationService: {
    lastSuccessfulSynchronizationTime: jest.fn().mockResolvedValue(null),
  },
};

let jiraClient: JiraClient;
let executionContext: IntegrationExecutionContext;

beforeEach(() => {
  jiraClient = ({
    fetchProjects: jest.fn().mockReturnValue([]),
    fetchServerInfo: jest.fn().mockReturnValue([]),
    fetchIssuesPage: jest.fn().mockReturnValue([]),
    fetchUsersPage: jest.fn().mockReturnValue([]),
    addNewIssue: jest.fn().mockReturnValue({}),
    findIssue: jest.fn().mockReturnValue(undefined),
  } as unknown) as JiraClient;

  (createJiraClient as jest.Mock).mockReturnValue(jiraClient);

  executionContext = ({
    event: {
      action: {
        name: IntegrationActionName.INGEST,
      },
    },
    clients: {
      getClients: () => clients,
    },
    instance: {
      config: {},
    },
    logger: {
      debug: jest.fn(),
    },
  } as unknown) as IntegrationExecutionContext;
});

describe("CREATE_ENTITY", () => {
  test("creates issue", async () => {
    (executionContext as any).event = {
      action: {
        name: IntegrationActionName.CREATE_ENTITY,
        class: "Vulnerability",
        properties: {
          summary: "Test Summary",
          description: "Test Description",
          classification: "Test Classification",
          project: "Test Project key/id",
        },
      },
    };

    await executionHandler(executionContext);

    expect(jiraClient.fetchProjects).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchServerInfo).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchUsersPage).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchIssuesPage).toHaveBeenCalledTimes(0);
    expect(jiraClient.addNewIssue).toHaveBeenCalledTimes(1);
    expect(jiraClient.findIssue).toHaveBeenCalledTimes(1);
    expect(clients.persister.processEntities).toHaveBeenCalledTimes(1);
    expect(clients.persister.processRelationships).toHaveBeenCalledTimes(1);
    expect(clients.persister.publishPersisterOperations).toHaveBeenCalledTimes(
      1,
    );
  });
});

describe("unhandled action", () => {
  test("ignored", async () => {
    (executionContext.event as any).action = {
      name: IntegrationActionName.SCAN,
    };

    await executionHandler(executionContext);

    expect(jiraClient.fetchProjects).not.toHaveBeenCalled();
    expect(jiraClient.fetchServerInfo).not.toHaveBeenCalled();
    expect(jiraClient.fetchUsersPage).not.toHaveBeenCalled();
    expect(jiraClient.fetchIssuesPage).not.toHaveBeenCalled();
    expect(jiraClient.addNewIssue).not.toHaveBeenCalled();
    expect(jiraClient.findIssue).not.toHaveBeenCalled();
    expect(clients.persister.processEntities).not.toHaveBeenCalled();
    expect(clients.persister.processRelationships).not.toHaveBeenCalled();
    expect(clients.persister.publishPersisterOperations).not.toHaveBeenCalled();
  });
});
