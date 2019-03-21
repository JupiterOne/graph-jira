import {
  IntegrationExecutionContext,
  IntegrationInvocationEvent,
} from "@jupiterone/jupiter-managed-integration-sdk";
import executionHandler from "./executionHandler";
import initializeContext from "./initializeContext";
import { Project } from "./jira";

jest.mock("./initializeContext");

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
  },
];

describe("Config initialization with empty data", () => {
  test("executionHandler with empty all fetched data", async () => {
    const executionContext = {
      graph: {
        findEntitiesByType: jest.fn().mockResolvedValue([]),
        findRelationshipsByType: jest.fn().mockResolvedValue([]),
      },
      persister: {
        processEntities: jest.fn().mockReturnValue([]),
        processRelationships: jest.fn().mockReturnValue([]),
        publishPersisterOperations: jest.fn().mockResolvedValue({}),
      },
      provider: {
        authenticate: jest.fn().mockReturnValue({}),
        fetchProjects: jest.fn().mockReturnValue([]),
        fetchServerInfo: jest.fn().mockReturnValue([]),
        fetchIssues: jest.fn().mockReturnValue([]),
        fetchUsers: jest.fn().mockReturnValue([]),
      },
      projects: undefined,
    };

    (initializeContext as jest.Mock).mockReturnValue(executionContext);

    const invocationContext = {
      instance: {
        config: {},
      },
    } as IntegrationExecutionContext<IntegrationInvocationEvent>;

    await executionHandler(invocationContext);

    expect(initializeContext).toHaveBeenCalledWith(invocationContext);
    expect(executionContext.provider.fetchProjects).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchServerInfo).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchUsers).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchIssues).toHaveBeenCalledTimes(0);
    expect(executionContext.persister.processEntities).toHaveBeenCalledTimes(4);
    expect(
      executionContext.persister.publishPersisterOperations,
    ).toHaveBeenCalledTimes(1);
  });
});

describe("Config initialization with data", () => {
  let executionContext: {
    graph?: {
      findEntitiesByType: jest.Mock<any, any>;
      findRelationshipsByType: jest.Mock<any, any>;
    };
    persister: any;
    provider: any;
    projects?: string;
  };

  beforeAll(() => {
    executionContext = {
      graph: {
        findEntitiesByType: jest.fn().mockResolvedValue([]),
        findRelationshipsByType: jest.fn().mockResolvedValue([]),
      },
      persister: {
        processEntities: jest.fn().mockReturnValue([]),
        processRelationships: jest.fn().mockReturnValue([]),
        publishPersisterOperations: jest.fn().mockResolvedValue({}),
      },
      provider: {
        authenticate: jest.fn().mockReturnValue({}),
        fetchProjects: jest.fn().mockReturnValue(twoProjects),
        fetchServerInfo: jest.fn().mockReturnValue([]),
        fetchIssues: jest.fn().mockReturnValue([]),
        fetchUsers: jest.fn().mockReturnValue([]),
      },
    };
  });

  test("executionHandler with two projects from fetched data and empty config", async () => {
    const invocationContext = {
      instance: {
        config: {},
      },
    } as IntegrationExecutionContext<IntegrationInvocationEvent>;

    (initializeContext as jest.Mock).mockReturnValue(executionContext);

    await executionHandler(invocationContext);

    expect(initializeContext).toHaveBeenCalledWith(invocationContext);
    expect(executionContext.provider.fetchProjects).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchServerInfo).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchUsers).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchIssues).toHaveBeenCalledTimes(2);
    expect(executionContext.persister.processEntities).toHaveBeenCalledTimes(4);
    expect(
      executionContext.persister.publishPersisterOperations,
    ).toHaveBeenCalledTimes(1);
  });

  test("executionHandler with two projects from fetched data and projects string from config", async () => {
    const invocationContext = {
      instance: {
        config: {
          projects: "",
        },
      },
    } as IntegrationExecutionContext<IntegrationInvocationEvent>;

    executionContext.projects = invocationContext.instance.config.projects;

    (initializeContext as jest.Mock).mockReturnValue(executionContext);

    await executionHandler(invocationContext);

    expect(initializeContext).toHaveBeenCalledWith(invocationContext);
    expect(executionContext.provider.fetchProjects).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchServerInfo).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchUsers).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchIssues).toHaveBeenCalledTimes(2);
    expect(executionContext.persister.processEntities).toHaveBeenCalledTimes(4);
    expect(
      executionContext.persister.publishPersisterOperations,
    ).toHaveBeenCalledTimes(1);
  });

  test("executionHandler with two projects from fetched data and empty projects array from config", async () => {
    const invocationContext = {
      instance: {
        config: {
          projects: "[]",
        },
      },
    } as IntegrationExecutionContext<IntegrationInvocationEvent>;

    executionContext.projects = invocationContext.instance.config.projects;

    (initializeContext as jest.Mock).mockReturnValue(executionContext);

    await executionHandler(invocationContext);

    expect(initializeContext).toHaveBeenCalledWith(invocationContext);
    expect(executionContext.provider.fetchProjects).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchServerInfo).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchUsers).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchIssues).toHaveBeenCalledTimes(2);
    expect(executionContext.persister.processEntities).toHaveBeenCalledTimes(4);
    expect(
      executionContext.persister.publishPersisterOperations,
    ).toHaveBeenCalledTimes(1);
  });

  test("executionHandler with two projects from fetched data and projects with empty item from config", async () => {
    const invocationContext = {
      instance: {
        config: {
          projects: '[""]',
        },
      },
    } as IntegrationExecutionContext<IntegrationInvocationEvent>;

    executionContext.projects = invocationContext.instance.config.projects;

    (initializeContext as jest.Mock).mockReturnValue(executionContext);

    await executionHandler(invocationContext);

    expect(initializeContext).toHaveBeenCalledWith(invocationContext);
    expect(executionContext.provider.fetchProjects).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchServerInfo).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchUsers).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchIssues).toHaveBeenCalledTimes(1);
    expect(executionContext.persister.processEntities).toHaveBeenCalledTimes(4);
    expect(
      executionContext.persister.publishPersisterOperations,
    ).toHaveBeenCalledTimes(1);
  });

  test("executionHandler with two projects from fetched data and projects with correct items from config", async () => {
    const invocationContext = {
      instance: {
        config: {
          projects:
            "[" +
            '{ "key": "First Project" },' +
            '{ "key": "Second Project" },' +
            '{ "key": "Third Project" }' +
            "]",
        },
      },
    } as IntegrationExecutionContext<IntegrationInvocationEvent>;

    executionContext.projects = invocationContext.instance.config.projects;

    (initializeContext as jest.Mock).mockReturnValue(executionContext);

    await executionHandler(invocationContext);

    expect(initializeContext).toHaveBeenCalledWith(invocationContext);
    expect(executionContext.provider.fetchProjects).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchServerInfo).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchUsers).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchIssues).toHaveBeenCalledTimes(3);
    expect(executionContext.persister.processEntities).toHaveBeenCalledTimes(4);
    expect(
      executionContext.persister.publishPersisterOperations,
    ).toHaveBeenCalledTimes(1);
  });

  test("executionHandler with two projects from fetched data and projects with incorrect items from config", async () => {
    const invocationContext = {
      instance: {
        config: {
          projects:
            "[" +
            '{ "key": "" },' +
            '{ "key": " " },' +
            '{ "key": "Fake Project" }' +
            "]",
        },
      },
    } as IntegrationExecutionContext<IntegrationInvocationEvent>;

    executionContext.projects = invocationContext.instance.config.projects;

    (initializeContext as jest.Mock).mockReturnValue(executionContext);

    await executionHandler(invocationContext);

    expect(initializeContext).toHaveBeenCalledWith(invocationContext);
    expect(executionContext.provider.fetchProjects).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchServerInfo).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchUsers).toHaveBeenCalledTimes(1);
    expect(executionContext.provider.fetchIssues).toHaveBeenCalledTimes(3);
    expect(executionContext.persister.processEntities).toHaveBeenCalledTimes(4);
    expect(
      executionContext.persister.publishPersisterOperations,
    ).toHaveBeenCalledTimes(1);
  });
});
