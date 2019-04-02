import {
  IntegrationInstanceAuthenticationError,
  IntegrationInstanceConfigError,
} from "@jupiterone/jupiter-managed-integration-sdk";
import invocationValidator from "./invocationValidator";

describe("invocationValidator errors", () => {
  test("should throw exception if jiraPassword is missed", async () => {
    const context = {
      instance: {
        config: {
          host: "testHost",
          jiraLogin: "testLogin",
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

  test("should throw exception if jiraLogin is missed", async () => {
    const context = {
      instance: {
        config: {
          host: "testHost",
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
          host: "fakeHost",
          jiraLogin: "fakeLogin",
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
