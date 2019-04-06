import {
  IntegrationActionName,
  IntegrationExecutionContext,
  IntegrationInvocationEvent,
  PersisterClient,
} from "@jupiterone/jupiter-managed-integration-sdk";

import executionHandler from "./executionHandler";
import { createJiraClient, Project } from "./jira";
import JiraClient from "./jira/JiraClient";

jest.mock("./jira");

const twoProjects: Project[] = [
  {
    self: "https://dualboot-test.atlassian.net/rest/api/3/project/10000",
    id: "10000",
    key: "FP",
    name: "First Project",
    avatarUrls: {
      "48x48":
        "https://dualboot-test.atlassian.net/secure/projectavatar?avatarId=10324",
      "24x24":
        "https://dualboot-test.atlassian.net/secure/projectavatar?size=small&avatarId=10324",
      "16x16":
        "https://dualboot-test.atlassian.net/secure/projectavatar?size=xsmall&avatarId=10324",
      "32x32":
        "https://dualboot-test.atlassian.net/secure/projectavatar?size=medium&avatarId=10324",
    },
    projectTypeKey: "software",
    simplified: false,
    style: "classic",
    isPrivate: false,
    url: "https://dualboot-test.atlassian.net/browse/FP",
  },
  {
    self: "https://dualboot-test.atlassian.net/rest/api/3/project/10001",
    id: "10001",
    key: "SP",
    name: "Second project",
    avatarUrls: {
      "48x48":
        "https://dualboot-test.atlassian.net/secure/projectavatar?avatarId=10324",
      "24x24":
        "https://dualboot-test.atlassian.net/secure/projectavatar?size=small&avatarId=10324",
      "16x16":
        "https://dualboot-test.atlassian.net/secure/projectavatar?size=xsmall&avatarId=10324",
      "32x32":
        "https://dualboot-test.atlassian.net/secure/projectavatar?size=medium&avatarId=10324",
    },
    projectTypeKey: "software",
    simplified: false,
    style: "classic",
    isPrivate: false,
    url: "https://dualboot-test.atlassian.net/browse/SP",
  },
];

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
};

let jiraClient: JiraClient;
let executionContext: IntegrationExecutionContext<IntegrationInvocationEvent>;

beforeEach(() => {
  jiraClient = ({
    fetchProjects: jest.fn().mockReturnValue(twoProjects),
    fetchServerInfo: jest.fn().mockReturnValue([]),
    fetchIssues: jest.fn().mockReturnValue([]),
    fetchUsers: jest.fn().mockReturnValue([]),
    addNewIssue: jest.fn().mockReturnValue({}),
    findIssue: jest.fn().mockReturnValue([]),
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
  } as unknown) as IntegrationExecutionContext<IntegrationInvocationEvent>;
});

describe("INGEST", () => {
  test("no projects in Jira", async () => {
    (jiraClient.fetchProjects as jest.Mock).mockResolvedValue([]);

    await executionHandler(executionContext);

    expect(jiraClient.fetchProjects).toHaveBeenCalledTimes(1);
    expect(jiraClient.fetchServerInfo).toHaveBeenCalledTimes(1);
    expect(jiraClient.fetchUsers).toHaveBeenCalledTimes(1);
    expect(jiraClient.fetchIssues).toHaveBeenCalledTimes(0);
    expect(clients.persister.processEntities).toHaveBeenCalledTimes(4);
    expect(clients.persister.publishPersisterOperations).toHaveBeenCalledTimes(
      1,
    );
  });

  test("all projects when no config.projects", async () => {
    await executionHandler(executionContext);

    expect(jiraClient.fetchProjects).toHaveBeenCalledTimes(1);
    expect(jiraClient.fetchServerInfo).toHaveBeenCalledTimes(1);
    expect(jiraClient.fetchUsers).toHaveBeenCalledTimes(1);
    expect(jiraClient.fetchIssues).toHaveBeenCalledTimes(2);
    expect(clients.persister.processEntities).toHaveBeenCalledTimes(4);
    expect(clients.persister.publishPersisterOperations).toHaveBeenCalledTimes(
      1,
    );
  });

  test("projects specified by config.projects", async () => {
    executionContext.instance.config.projects = ["FP", "SP", "UKP"];

    await executionHandler(executionContext);

    expect(jiraClient.fetchProjects).toHaveBeenCalledTimes(1);
    expect(jiraClient.fetchServerInfo).toHaveBeenCalledTimes(1);
    expect(jiraClient.fetchUsers).toHaveBeenCalledTimes(1);
    expect(jiraClient.fetchIssues).toHaveBeenCalledTimes(3);
    expect(clients.persister.processEntities).toHaveBeenCalledTimes(4);
    expect(clients.persister.publishPersisterOperations).toHaveBeenCalledTimes(
      1,
    );
  });
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
    expect(jiraClient.fetchUsers).toHaveBeenCalledTimes(0);
    expect(jiraClient.fetchIssues).toHaveBeenCalledTimes(0);
    expect(jiraClient.addNewIssue).toHaveBeenCalledTimes(1);
    expect(jiraClient.findIssue).toHaveBeenCalledTimes(1);
    expect(clients.persister.processEntities).toHaveBeenCalledTimes(1);
    expect(clients.persister.publishEntityOperations).toHaveBeenCalledTimes(1);
    expect(
      clients.persister.publishRelationshipOperations,
    ).toHaveBeenCalledTimes(0);
    expect(clients.persister.publishPersisterOperations).toHaveBeenCalledTimes(
      0,
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
    expect(jiraClient.fetchUsers).not.toHaveBeenCalled();
    expect(jiraClient.fetchIssues).not.toHaveBeenCalled();
    expect(jiraClient.addNewIssue).not.toHaveBeenCalled();
    expect(jiraClient.findIssue).not.toHaveBeenCalled();
    expect(clients.persister.processEntities).not.toHaveBeenCalled();
    expect(clients.persister.publishPersisterOperations).not.toHaveBeenCalled();
  });
});
