import {
  IntegrationInstanceAuthenticationError,
  IntegrationInstanceConfigError,
} from "@jupiterone/jupiter-managed-integration-sdk";
import nock from "nock";
import invocationValidator from "./invocationValidator";

describe("invocationValidator errors", () => {
  test("should throw exception if jiraPassword is missed", async () => {
    const context = {
      instance: {
        config: {
          jiraHost: "testHost",
          jiraUsername: "testLogin",
        },
      },
    };
    expect.assertions(1);
    try {
      await invocationValidator(context as any);
    } catch (err) {
      expect(err instanceof IntegrationInstanceConfigError).toBeTruthy();
    }
  });

  test("should throw exception if jiraUsername is missed", async () => {
    const context = {
      instance: {
        config: {
          jiraHost: "testHost",
          jiraPassword: "testPassword",
        },
      },
    };
    expect.assertions(1);
    try {
      await invocationValidator(context as any);
    } catch (err) {
      expect(err instanceof IntegrationInstanceConfigError).toBeTruthy();
    }
  });

  test("auth error", async () => {
    const executionContext = {
      instance: {
        config: {
          jiraHost: "fakeHost",
          jiraUsername: "fakeLogin",
          jiraPassword: "fakePassword",
        },
      },
    };

    try {
      await invocationValidator(executionContext as any);
    } catch (e) {
      expect(e instanceof IntegrationInstanceAuthenticationError).toBe(true);
    }
  });
});

describe("projects", () => {
  beforeAll(() => {
    nock.back.fixtures = `${__dirname}/../test/fixtures/`;
    process.env.CI
      ? nock.back.setMode("lockdown")
      : nock.back.setMode("record");
  });

  test("valid projects", async () => {
    const { nockDone } = await nock.back("invocation-projects.json");

    const executionContext = {
      instance: {
        config: {
          jiraHost: "fake-hostname.atlassian.net",
          jiraUsername: "fakeLogin",
          jiraPassword: "fakePassword",
          projects: ["IR"],
        },
      },
    };

    const result = await invocationValidator(executionContext as any);

    expect(result).toBeUndefined();
    nockDone();
  });

  test("invalid projects", async () => {
    const { nockDone } = await nock.back("invocation-projects.json");

    const executionContext = {
      instance: {
        config: {
          jiraHost: "fake-hostname.atlassian.net",
          jiraUsername: "fakeLogin",
          jiraPassword: "fakePassword",
          projects: ["INVALID_PROJECT"],
        },
      },
    };

    try {
      await invocationValidator(executionContext as any);
    } catch (e) {
      expect(e.message).toMatch(
        'The following project key(s) are invalid: ["INVALID_PROJECT"]. Ensure the authenticated user has access to this project.',
      );
    }
    nockDone();
  });
});
