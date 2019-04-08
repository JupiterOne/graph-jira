import nock from "nock";

import {
  createTestIntegrationExecutionContext,
  IntegrationActionName,
  IntegrationCreateEntityAction,
} from "@jupiterone/jupiter-managed-integration-sdk";

import initializeContext from "../initializeContext";
import createJiraIssue from "../jira/createJiraIssue";
import fetchJiraData from "../jira/fetchJiraData";
import { convert } from "./publishChanges";

const JIRA_LOCAL_EXECUTION_HOST =
  process.env.JIRA_LOCAL_EXECUTION_HOST || "example.atlassian.com";

function prepareScope(def: nock.NockDefinition) {
  def.scope = `https://${JIRA_LOCAL_EXECUTION_HOST}:443`;
}

async function initialize() {
  const context = {
    instance: {
      config: {
        jiraHost: JIRA_LOCAL_EXECUTION_HOST,
        jiraUsername: process.env.JIRA_LOCAL_EXECUTION_USERNAME,
        jiraPassword: process.env.JIRA_LOCAL_EXECUTION_PASSWORD,
      },
    },
  };

  const executionContext = {
    ...createTestIntegrationExecutionContext(context as any),
  };

  return await initializeContext(executionContext);
}

describe("Convert data after fetching", () => {
  const projectsEntityMock = [
    {
      _class: "Project",
      _key: "jira_project_10000",
      _type: "jira_project",
      displayName: "First Project",
      id: "10000",
      isPrivate: false,
      key: "FP",
      name: "First Project",
      projectTypeKey: "software",
      self: "https://dualboot-test.atlassian.net/rest/api/3/project/10000",
      simplified: false,
      style: "classic",
      webLink: "https://dualboot-test.atlassian.net/browse/FP",
    },
    {
      _class: "Project",
      _key: "jira_project_10001",
      _type: "jira_project",
      displayName: "Second project",
      id: "10001",
      isPrivate: false,
      key: "SP",
      name: "Second project",
      projectTypeKey: "software",
      self: "https://dualboot-test.atlassian.net/rest/api/3/project/10001",
      simplified: false,
      style: "classic",
      webLink: "https://dualboot-test.atlassian.net/browse/SP",
    },
  ];

  beforeAll(() => {
    nock.back.fixtures = `${__dirname}/../../test/fixtures/`;
    process.env.CI
      ? nock.back.setMode("lockdown")
      : nock.back.setMode("record");
  });

  test("convert server info", async () => {
    const { nockDone } = await nock.back("server-info-ok.json", {
      before: prepareScope,
    });
    const { jira, projects } = await initialize();

    jira.fetchUsers = jest.fn().mockReturnValue([]);
    jira.fetchProjects = jest.fn().mockReturnValue([]);
    jira.fetchIssues = jest.fn().mockReturnValue([]);

    const newData = convert(await fetchJiraData(jira, projects));
    expect(newData.entities.accounts).toEqual([
      {
        _class: "Account",
        _key: "jira_account_https://dualboot-test.atlassian.net",
        _type: "jira_account",
        displayName: "Jira",
        baseUrl: "https://dualboot-test.atlassian.net",
        version: "1001.0.0-SNAPSHOT",
        buildNumber: 100099,
        buildDate: "2019-03-25T04:00:00.000+0400",
        scmInfo: "e83467feebdf2319aa1c51e89e38c2c9ae8f4d2a",
        serverTitle: "Jira",
      },
    ]);
    nockDone();
  });

  test("convert projects", async () => {
    const { nockDone } = await nock.back("projects-ok.json", {
      before: prepareScope,
    });
    const { jira, projects } = await initialize();

    jira.fetchUsers = jest.fn().mockReturnValue([]);
    jira.fetchServerInfo = jest.fn().mockReturnValue([]);
    jira.fetchIssues = jest.fn().mockReturnValue([]);

    const newData = convert(await fetchJiraData(jira, projects));
    expect(newData.entities.projects).toEqual(projectsEntityMock);
    nockDone();
  });

  test("convert issues", async () => {
    const { nockDone } = await nock.back("issues-ok.json", {
      before: prepareScope,
    });
    const { jira, projects } = await initialize();

    jira.fetchUsers = jest.fn().mockReturnValue([]);
    jira.fetchServerInfo = jest.fn().mockReturnValue([]);
    jira.fetchProjects = jest
      .fn()
      .mockReturnValue(projectsEntityMock.slice(0, 1));

    const newData = convert(await fetchJiraData(jira, projects));
    expect(newData.entities.issues).toEqual([
      {
        _class: "Record",
        _key: "jira_issue_10003",
        _type: "jira_issue",
        assignee: undefined,
        category: "issue",
        creator: "admin",
        id: "10003",
        name: "FP-2",
        displayName: "FP-2",
        reporter: "admin",
        status: "To Do",
        summary: "subtask",
        webLink: "https://dualboot-test.atlassian.net/browse/FP-2",
      },
      {
        _class: "Record",
        _key: "jira_issue_10000",
        _type: "jira_issue",
        assignee: "andrew.kulakov",
        category: "issue",
        creator: "admin",
        id: "10000",
        name: "FP-1",
        displayName: "FP-1",
        reporter: null,
        status: "In Review",
        summary: "First Issue",
        webLink: "https://dualboot-test.atlassian.net/browse/FP-1",
      },
    ]);
    nockDone();
  });

  test("convert users", async () => {
    const { nockDone } = await nock.back("users-ok.json", {
      before: prepareScope,
    });
    const { jira, projects } = await initialize();

    jira.fetchIssues = jest.fn().mockReturnValue([]);
    jira.fetchServerInfo = jest.fn().mockReturnValue([]);
    jira.fetchProjects = jest.fn().mockReturnValue([]);

    const newData = convert(await fetchJiraData(jira, projects));
    expect(newData.entities.users).toEqual([
      {
        _class: "User",
        _key: "jira_user_557058:950f9f5b-3d6d-4e1d-954a-21367ae9ac75",
        _type: "jira_user",
        active: true,
        displayName: "Jira Service Desk Widget",
        email: "com.atlassian.servicedesk.embedded@connect.atlassian.com",
        id: "557058:950f9f5b-3d6d-4e1d-954a-21367ae9ac75",
        key: "addon_com.atlassian.servicedesk.embedded",
        name: "addon_com.atlassian.servicedesk.embedded",
        self:
          "https://dualboot-test.atlassian.net/rest/api/3/user?accountId=557058:950f9f5b-3d6d-4e1d-954a-21367ae9ac75",
        timeZone: "Europe/Samara",
      },
      {
        _class: "User",
        _key: "jira_user_557058:60a707fb-8250-4607-9e87-cbbae030f722",
        _type: "jira_user",
        active: true,
        displayName: "Sketch",
        email: "jira-sketch-integration@connect.atlassian.com",
        id: "557058:60a707fb-8250-4607-9e87-cbbae030f722",
        key: "addon_jira-sketch-integration",
        name: "addon_jira-sketch-integration",
        self:
          "https://dualboot-test.atlassian.net/rest/api/3/user?accountId=557058:60a707fb-8250-4607-9e87-cbbae030f722",
        timeZone: "Europe/Samara",
      },
      {
        _class: "User",
        _key: "jira_user_557058:0867a421-a9ee-4659-801a-bc0ee4a4487e",
        _type: "jira_user",
        active: true,
        displayName: "Slack",
        email: "jira-slack-integration@connect.atlassian.com",
        id: "557058:0867a421-a9ee-4659-801a-bc0ee4a4487e",
        key: "addon_jira-slack-integration",
        name: "addon_jira-slack-integration",
        self:
          "https://dualboot-test.atlassian.net/rest/api/3/user?accountId=557058:0867a421-a9ee-4659-801a-bc0ee4a4487e",
        timeZone: "Europe/Samara",
      },
      {
        _class: "User",
        _key: "jira_user_557058:214cdd6a-ff93-4d8b-838b-62dfcf1a2a71",
        _type: "jira_user",
        active: true,
        displayName: "Trello",
        email: "jira-trello-integration@connect.atlassian.com",
        id: "557058:214cdd6a-ff93-4d8b-838b-62dfcf1a2a71",
        key: "addon_jira-trello-integration",
        name: "addon_jira-trello-integration",
        self:
          "https://dualboot-test.atlassian.net/rest/api/3/user?accountId=557058:214cdd6a-ff93-4d8b-838b-62dfcf1a2a71",
        timeZone: "Europe/Samara",
      },
      {
        _class: "User",
        _key: "jira_user_5ac5326a95d30150501e5ff4",
        _type: "jira_user",
        active: true,
        displayName: "Jira Cloud for Workplace",
        email: "jira-workplace-integration@connect.atlassian.com",
        id: "5ac5326a95d30150501e5ff4",
        key: "addon_jira-workplace-integration",
        name: "addon_jira-workplace-integration",
        self:
          "https://dualboot-test.atlassian.net/rest/api/3/user?accountId=5ac5326a95d30150501e5ff4",
        timeZone: "Europe/Samara",
      },
      {
        _class: "User",
        _key: "jira_user_5b6c7b3afbc68529c6c47967",
        _type: "jira_user",
        active: true,
        displayName: "Statuspage for Jira",
        email: "stspg-jira-ops@connect.atlassian.com",
        id: "5b6c7b3afbc68529c6c47967",
        key: "addon_stspg-jira-ops",
        name: "addon_stspg-jira-ops",
        self:
          "https://dualboot-test.atlassian.net/rest/api/3/user?accountId=5b6c7b3afbc68529c6c47967",
        timeZone: "Europe/Samara",
      },
      {
        _class: "User",
        _key: "jira_user_5c937560807a642e13136645",
        _type: "jira_user",
        active: true,
        displayName: "Admin Admin",
        email: "admin@test.dualboot.com",
        id: "5c937560807a642e13136645",
        key: "admin",
        name: "admin",
        self:
          "https://dualboot-test.atlassian.net/rest/api/3/user?accountId=5c937560807a642e13136645",
        timeZone: "Europe/Samara",
      },
      {
        _class: "User",
        _key: "jira_user_5c9373df0769b92d1851468c",
        _type: "jira_user",
        active: true,
        displayName: "Andrew Kulakov",
        email: "andrew.kulakov@test.dualboot.com",
        id: "5c9373df0769b92d1851468c",
        key: "andrew.kulakov",
        name: "andrew.kulakov",
        self:
          "https://dualboot-test.atlassian.net/rest/api/3/user?accountId=5c9373df0769b92d1851468c",
        timeZone: "Europe/Samara",
      },
    ]);
    nockDone();
  });

  test("convert account-project relations", async () => {
    const { nockDone } = await nock.back("account-projects-ok.json", {
      before: prepareScope,
    });
    const { jira, projects } = await initialize();

    jira.fetchUsers = jest.fn().mockReturnValue([]);
    jira.fetchIssues = jest.fn().mockReturnValue([]);

    const newData = convert(await fetchJiraData(jira, projects));
    expect(newData.relationships.accountProjectRelationships).toEqual([
      {
        _class: "HAS",
        _fromEntityKey: "jira_account_https://dualboot-test.atlassian.net",
        _key:
          "jira_account_https://dualboot-test.atlassian.net_has_jira_project_10000",
        _toEntityKey: "jira_project_10000",
        _type: "jira_account_has_project",
      },
      {
        _class: "HAS",
        _fromEntityKey: "jira_account_https://dualboot-test.atlassian.net",
        _key:
          "jira_account_https://dualboot-test.atlassian.net_has_jira_project_10001",
        _toEntityKey: "jira_project_10001",
        _type: "jira_account_has_project",
      },
    ]);
    nockDone();
  });

  test("convert project-issue relations", async () => {
    const { nockDone } = await nock.back("issue-ok.json", {
      before: prepareScope,
    });
    const { jira, projects } = await initialize();

    jira.fetchUsers = jest.fn().mockReturnValue([]);
    jira.fetchServerInfo = jest.fn().mockReturnValue([]);
    jira.fetchProjects = jest
      .fn()
      .mockReturnValue(projectsEntityMock.slice(0, 1));

    const newData = convert(await fetchJiraData(jira, projects));
    expect(newData.relationships.projectIssueRelationships).toEqual([
      {
        _class: "HAS",
        _fromEntityKey: "jira_project_10000",
        _key: "jira_project_10000_has_jira_issue_10003",
        _toEntityKey: "jira_issue_10003",
        _type: "jira_project_has_issue",
      },
      {
        _class: "HAS",
        _fromEntityKey: "jira_project_10000",
        _key: "jira_project_10000_has_jira_issue_10000",
        _toEntityKey: "jira_issue_10000",
        _type: "jira_project_has_issue",
      },
    ]);
    nockDone();
  });

  test("convert user-created-issue relations", async () => {
    const { nockDone } = await nock.back("issue-created-by-user-ok.json", {
      before: prepareScope,
    });
    const { jira, projects } = await initialize();

    jira.fetchServerInfo = jest.fn().mockReturnValue([]);

    const newData = convert(await fetchJiraData(jira, projects));
    expect(newData.relationships.userCreatedIssueRelationships).toEqual([
      {
        _class: "CREATED",
        _fromEntityKey: "jira_user_5c937560807a642e13136645",
        _key: "jira_user_5c937560807a642e13136645_created_jira_issue_10003",
        _toEntityKey: "jira_issue_10003",
        _type: "jira_user_created_issue",
      },
      {
        _class: "CREATED",
        _fromEntityKey: "jira_user_5c937560807a642e13136645",
        _key: "jira_user_5c937560807a642e13136645_created_jira_issue_10000",
        _toEntityKey: "jira_issue_10000",
        _type: "jira_user_created_issue",
      },
      {
        _class: "CREATED",
        _fromEntityKey: "jira_user_5c937560807a642e13136645",
        _key: "jira_user_5c937560807a642e13136645_created_jira_issue_10002",
        _toEntityKey: "jira_issue_10002",
        _type: "jira_user_created_issue",
      },
      {
        _class: "CREATED",
        _fromEntityKey: "jira_user_5c937560807a642e13136645",
        _key: "jira_user_5c937560807a642e13136645_created_jira_issue_10001",
        _toEntityKey: "jira_issue_10001",
        _type: "jira_user_created_issue",
      },
    ]);
    nockDone();
  });

  test("convert user-reported-issue relations", async () => {
    const { nockDone } = await nock.back("issue-reported-by-user-ok.json", {
      before: prepareScope,
    });
    const { jira, projects } = await initialize();

    jira.fetchServerInfo = jest.fn().mockReturnValue([]);

    const newData = convert(await fetchJiraData(jira, projects));
    expect(newData.relationships.userReportedIssueRelationships).toEqual([
      {
        _class: "REPORTED",
        _fromEntityKey: "jira_user_5c937560807a642e13136645",
        _key: "jira_user_5c937560807a642e13136645_reported_jira_issue_10003",
        _toEntityKey: "jira_issue_10003",
        _type: "jira_user_reported_issue",
      },
      {
        _class: "REPORTED",
        _fromEntityKey: "jira_user_5c937560807a642e13136645",
        _key: "jira_user_5c937560807a642e13136645_reported_jira_issue_10000",
        _toEntityKey: "jira_issue_10000",
        _type: "jira_user_reported_issue",
      },
      {
        _class: "REPORTED",
        _fromEntityKey: "jira_user_5c937560807a642e13136645",
        _key: "jira_user_5c937560807a642e13136645_reported_jira_issue_10002",
        _toEntityKey: "jira_issue_10002",
        _type: "jira_user_reported_issue",
      },
      {
        _class: "REPORTED",
        _fromEntityKey: "jira_user_5c937560807a642e13136645",
        _key: "jira_user_5c937560807a642e13136645_reported_jira_issue_10001",
        _toEntityKey: "jira_issue_10001",
        _type: "jira_user_reported_issue",
      },
    ]);
    nockDone();
  });

  afterAll(() => {
    nock.restore();
  });
});

describe("Convert data after creating issue", () => {
  beforeAll(() => {
    nock.back.fixtures = `${__dirname}/../../test/fixtures/`;
    nock.back.setMode("record");
  });

  test("convert issue entity after creating", async () => {
    const { nockDone } = await nock.back("issue-creating-ok.json", {
      before: prepareScope,
    });
    const { jira } = await initialize();

    const newData = convert(
      await createJiraIssue(jira, {
        name: IntegrationActionName.CREATE_ENTITY,
        class: "Vulnerability",
        properties: {
          summary: "Test Summary",
          description: "Test Description",
          classification: "Task",
          project: "10000",
        },
      } as IntegrationCreateEntityAction),
    );
    nockDone();
    expect(newData.entities.issues).toEqual([
      {
        _class: "Record",
        _key: "jira_issue_10015",
        _type: "jira_issue",
        assignee: undefined,
        category: "issue",
        creator: "admin",
        id: "10015",
        name: "FP-14",
        displayName: "FP-14",
        reporter: "admin",
        status: "To Do",
        summary: "Test Summary",
        webLink: "https://dualboot-test.atlassian.net/browse/FP-14",
      },
    ]);
    expect(newData.relationships.projectIssueRelationships).toEqual([
      {
        _class: "HAS",
        _fromEntityKey: "jira_project_10000",
        _key: "jira_project_10000_has_jira_issue_10015",
        _toEntityKey: "jira_issue_10015",
        _type: "jira_project_has_issue",
      },
    ]);
    expect(newData.relationships.userReportedIssueRelationships).toEqual([
      {
        _class: "REPORTED",
        _fromEntityKey: "jira_user_5c937560807a642e13136645",
        _key: "jira_user_5c937560807a642e13136645_reported_jira_issue_10015",
        _toEntityKey: "jira_issue_10015",
        _type: "jira_user_reported_issue",
      },
    ]);
    expect(newData.relationships.userCreatedIssueRelationships).toEqual([
      {
        _class: "CREATED",
        _fromEntityKey: "jira_user_5c937560807a642e13136645",
        _key: "jira_user_5c937560807a642e13136645_created_jira_issue_10015",
        _toEntityKey: "jira_issue_10015",
        _type: "jira_user_created_issue",
      },
    ]);
  });

  afterAll(() => {
    nock.restore();
  });
});
