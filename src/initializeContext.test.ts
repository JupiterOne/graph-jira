import {
  IntegrationExecutionContext,
  IntegrationInvocationEvent,
  IntegrationJob,
} from "@jupiterone/jupiter-managed-integration-sdk";
import JobsClient from "@jupiterone/jupiter-managed-integration-sdk/service/JobsClient";

import initializeContext from "./initializeContext";
import { createJiraClient } from "./jira";

jest.mock("./jira");

const jiraClient = {};
(createJiraClient as jest.Mock).mockReturnValue(jiraClient);

const clients = {
  graph: {},
  persister: {},
  jobs: {
    logEvent: jest.fn().mockReturnValue({}),
    getLastCompleted: jest.fn().mockReturnValue({
      id: "0",
      integrationInstanceId: "0",
      createDate: Date.parse("2019-04-08T12:51:50.417Z"),
      errorsOccurred: false,
    } as IntegrationJob),
  } as JobsClient,
};

let executionContext: IntegrationExecutionContext<IntegrationInvocationEvent>;

beforeEach(() => {
  executionContext = {
    clients: {
      getClients: () => clients,
    },
    instance: {
      config: {},
    },
  } as IntegrationExecutionContext<IntegrationInvocationEvent>;
});

test("defaults", async () => {
  const context = await initializeContext(executionContext);
  const lastJob = await clients.jobs.getLastCompleted();
  const lastJobTimestamp = lastJob && lastJob.createDate;
  expect(context.graph).toBe(clients.graph);
  expect(context.persister).toBe(clients.persister);
  expect(context.jira).toBe(jiraClient);
  expect(context.projects).toEqual([]);
  expect(context.lastJobTimestamp).toEqual(lastJobTimestamp);
});

describe("config.projects", () => {
  test("undefined", async () => {
    delete executionContext.instance.config.projects;
    const context = await initializeContext(executionContext);
    expect(context.projects).toEqual([]);
  });

  test("empty string", async () => {
    executionContext.instance.config.projects = "";
    const context = await initializeContext(executionContext);
    expect(context.projects).toEqual([]);
  });

  test("empty array", async () => {
    executionContext.instance.config.projects = [];
    const context = await initializeContext(executionContext);
    expect(context.projects).toEqual([]);
  });

  test("array of empty string", async () => {
    executionContext.instance.config.projects = ["", " "];
    const context = await initializeContext(executionContext);
    expect(context.projects).toEqual([]);
  });

  test("array of project config with empty key", async () => {
    executionContext.instance.config.projects = [{ key: "" }, { key: " " }];
    const context = await initializeContext(executionContext);
    expect(context.projects).toEqual([]);
  });

  test("single key string", async () => {
    executionContext.instance.config.projects = "KEY";
    const context = await initializeContext(executionContext);
    expect(context.projects).toEqual([{ key: "KEY" }]);
  });

  test("array of key strings", async () => {
    executionContext.instance.config.projects = ["KEY", "KEY2"];
    const context = await initializeContext(executionContext);
    expect(context.projects).toEqual([{ key: "KEY" }, { key: "KEY2" }]);
  });

  test("array of project config", async () => {
    executionContext.instance.config.projects = [
      { key: "KEY" },
      { key: "KEY2" },
    ];
    const context = await initializeContext(executionContext);
    expect(context.projects).toEqual([{ key: "KEY" }, { key: "KEY2" }]);
  });
});
