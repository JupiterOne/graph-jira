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
