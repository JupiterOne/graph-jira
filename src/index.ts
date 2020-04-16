import {
  IntegrationError,
  IntegrationInvocationConfig,
  IntegrationStepExecutionContext,
} from "@jupiterone/jupiter-managed-integration-sdk";

import executionHandler from "./executionHandler";
import initializeContext from "./initializeContext";
import invocationValidator from "./invocationValidator";
import fetchBatchOfIssues from "./jira/fetchBatchOfIssues";
import fetchBatchOfUsers from "./jira/fetchBatchOfUsers";
import synchronizeAccountAndProjects from "./synchronizers/synchronizeAccountAndProjects";
import synchronizeIssues from "./synchronizers/synchronizeIssues";
import synchronizeUsers from "./synchronizers/synchronizeUsers";

/**
 * The invocation config for actions other than INGEST.
 */
export const invocationConfig: IntegrationInvocationConfig = {
  invocationValidator,
  executionHandler,
};

/**
 * The invocation config for INGEST.
 */
export const stepFunctionsInvocationConfig: IntegrationInvocationConfig = {
  instanceConfigFields: {
    jiraHost: {
      type: "string",
      mask: false,
    },
    jiraUsername: {
      type: "string",
      mask: false,
    },
    jiraPassword: {
      type: "string",
      mask: true,
    },
    projects: {
      type: "array",
      mask: false,
    },
  },

  invocationValidator,

  integrationStepPhases: [
    {
      steps: [
        {
          name: "Synchronize Account & Projects",
          id: "account-and-projects",
          executionHandler: async (
            executionContext: IntegrationStepExecutionContext,
          ) => {
            return synchronizeAccountAndProjects(
              await initializeContext(executionContext),
            );
          },
        },
      ],
    },
    {
      steps: [
        {
          id: "fetch-users",
          name: "Fetch Users",
          iterates: true,
          executionHandler: async (
            executionContext: IntegrationStepExecutionContext,
          ) => {
            const iterationState = executionContext.event.iterationState;
            if (!iterationState) {
              throw new IntegrationError(
                "Expected iterationState not found in event!",
              );
            }
            return fetchBatchOfUsers(
              await initializeContext(executionContext),
              iterationState,
            );
          },
        },
      ],
    },
    {
      steps: [
        {
          id: "synchronize-users",
          name: "Synchronize Users",
          executionHandler: async (
            executionContext: IntegrationStepExecutionContext,
          ) => {
            return synchronizeUsers(await initializeContext(executionContext));
          },
        },
      ],
    },
    {
      steps: [
        {
          id: "fetch-issues",
          name: "Fetch Issues",
          iterates: true,
          executionHandler: async (
            executionContext: IntegrationStepExecutionContext,
          ) => {
            const iterationState = executionContext.event.iterationState;
            if (!iterationState) {
              throw new IntegrationError(
                "Expected iterationState not found in event!",
              );
            }
            return fetchBatchOfIssues(
              await initializeContext(executionContext),
              iterationState,
            );
          },
        },
      ],
    },
    {
      steps: [
        {
          id: "synchronize-issues",
          name: "Synchronize Issues",
          executionHandler: async (
            executionContext: IntegrationStepExecutionContext,
          ) => {
            return synchronizeIssues(await initializeContext(executionContext));
          },
        },
      ],
    },
  ],
};
