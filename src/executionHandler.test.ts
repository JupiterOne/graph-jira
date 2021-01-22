import {
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
  persister: ({
    processEntities: jest.fn().mockReturnValue([]),
    processRelationships: jest.fn().mockReturnValue([]),
    publishEntityOperations: jest.fn().mockResolvedValue({}),
    publishRelationshipOperations: jest.fn().mockResolvedValue({}),
    publishPersisterOperations: jest.fn().mockResolvedValue({}),
  } as unknown) as PersisterClient,
  integrationService: {
    lastSuccessfulSynchronizationTime: jest.fn().mockResolvedValue(null),
  },
};

let jiraClient: JiraClient;
let projectKeyToProjectIdMock: jest.Mock;
let executionContext: IntegrationExecutionContext;

beforeEach(() => {
  jiraClient = ({
    fetchFields: jest.fn().mockReturnValue([]),
    fetchProjects: jest.fn().mockReturnValue([]),
    fetchServerInfo: jest.fn().mockReturnValue([]),
    fetchIssuesPage: jest.fn().mockReturnValue([]),
    fetchUsersPage: jest.fn().mockReturnValue([]),
    addNewIssue: jest.fn().mockReturnValue({}),
    findIssue: jest.fn().mockReturnValue(undefined),
    projectKeyToProjectId: jest.fn(),
  } as unknown) as JiraClient;

  (createJiraClient as jest.Mock).mockReturnValue(jiraClient);
  projectKeyToProjectIdMock = jiraClient.projectKeyToProjectId as jest.Mock;

  executionContext = ({
    event: {
      action: {
        name: "INGEST",
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
      info: jest.fn(),
    },
  } as unknown) as IntegrationExecutionContext;
});

describe("CREATE_ENTITY", () => {
  test("creates issue with a string project id", async () => {
    (executionContext as any).event = {
      action: {
        name: "CREATE_ENTITY",
        class: "Vulnerability",
        properties: {
          summary: "Test Summary",
          description: "Test Description",
          classification: "Test Classification",
          project: "12345",
        },
      },
    };

    projectKeyToProjectIdMock.mockRejectedValueOnce(
      new Error("should not call projectKeyToProjectId"),
    );
    await executionHandler(executionContext);

    expect(jiraClient.fetchProjects).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchServerInfo).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchUsersPage).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchIssuesPage).toHaveBeenCalledTimes(0);

    expect(jiraClient.addNewIssue).toHaveBeenCalledTimes(1);
    expect(jiraClient.addNewIssue).toHaveBeenCalledWith(
      "Test Summary",
      12345,
      "Test Classification",
      undefined,
    );

    expect(jiraClient.findIssue).toHaveBeenCalledTimes(1);
    expect(projectKeyToProjectIdMock).toHaveBeenCalledTimes(0);
    expect(clients.persister.processEntities).toHaveBeenCalledTimes(1);
    expect(clients.persister.processRelationships).toHaveBeenCalledTimes(1);
    expect(clients.persister.publishPersisterOperations).toHaveBeenCalledTimes(
      1,
    );
  });

  test("should throw error attempting to create an entity if project includes has a decimal of 0", async () => {
    (executionContext as any).event = {
      action: {
        name: "CREATE_ENTITY",
        class: "Vulnerability",
        properties: {
          summary: "Test Summary",
          description: "Test Description",
          classification: "Test Classification",
          project: "12345.0",
        },
      },
    };

    projectKeyToProjectIdMock.mockRejectedValueOnce(
      new Error("should not call projectKeyToProjectId"),
    );
    await expect(executionHandler(executionContext)).rejects.toThrowError(
      "Invalid project id provided (projectId=12345.0)",
    );

    expect(jiraClient.fetchProjects).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchServerInfo).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchUsersPage).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchIssuesPage).toHaveBeenCalledTimes(0);
    expect(jiraClient.addNewIssue).toHaveBeenCalledTimes(0);
    expect(jiraClient.findIssue).toHaveBeenCalledTimes(0);
    expect(projectKeyToProjectIdMock).toHaveBeenCalledTimes(0);
    expect(clients.persister.processEntities).toHaveBeenCalledTimes(0);
    expect(clients.persister.processRelationships).toHaveBeenCalledTimes(0);
    expect(clients.persister.publishPersisterOperations).toHaveBeenCalledTimes(
      0,
    );
  });

  test("should throw error attempting to create an entity if project includes has a decimal that is not 0", async () => {
    (executionContext as any).event = {
      action: {
        name: "CREATE_ENTITY",
        class: "Vulnerability",
        properties: {
          summary: "Test Summary",
          description: "Test Description",
          classification: "Test Classification",
          project: "12345.5",
        },
      },
    };

    projectKeyToProjectIdMock.mockRejectedValueOnce(
      new Error("should not call projectKeyToProjectId"),
    );
    await expect(executionHandler(executionContext)).rejects.toThrowError(
      "Invalid project id provided (projectId=12345.5)",
    );

    expect(jiraClient.fetchProjects).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchServerInfo).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchUsersPage).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchIssuesPage).toHaveBeenCalledTimes(0);
    expect(jiraClient.addNewIssue).toHaveBeenCalledTimes(0);
    expect(jiraClient.findIssue).toHaveBeenCalledTimes(0);
    expect(projectKeyToProjectIdMock).toHaveBeenCalledTimes(0);
    expect(clients.persister.processEntities).toHaveBeenCalledTimes(0);
    expect(clients.persister.processRelationships).toHaveBeenCalledTimes(0);
    expect(clients.persister.publishPersisterOperations).toHaveBeenCalledTimes(
      0,
    );
  });

  test("creates issue with a string project key", async () => {
    (executionContext as any).event = {
      action: {
        name: "CREATE_ENTITY",
        class: "Vulnerability",
        properties: {
          summary: "Test Summary",
          description: "Test Description",
          classification: "Test Classification",
          project: "TEST",
        },
      },
    };

    projectKeyToProjectIdMock.mockImplementationOnce(
      async (projectKey: string) => {
        return 12345;
      },
    );

    await executionHandler(executionContext);

    expect(jiraClient.fetchProjects).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchServerInfo).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchUsersPage).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchIssuesPage).toHaveBeenCalledTimes(0);
    expect(jiraClient.findIssue).toHaveBeenCalledTimes(1);

    expect(jiraClient.addNewIssue).toHaveBeenCalledTimes(1);
    expect(jiraClient.addNewIssue).toHaveBeenCalledWith(
      "Test Summary",
      12345,
      "Test Classification",
      undefined,
    );

    expect(projectKeyToProjectIdMock).toHaveBeenCalledTimes(1);
    expect(projectKeyToProjectIdMock).toHaveBeenLastCalledWith("TEST");

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
      name: "SCAN",
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
