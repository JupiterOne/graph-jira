/* tslint:disable:no-console */
import {
  createLocalInvocationEvent,
  executeSingleHandlerLocal,
} from "@jupiterone/jupiter-managed-integration-sdk";
import { createLogger, TRACE } from "bunyan";
import { executionHandler } from "../src/index";

async function run(): Promise<void> {
  const logger = createLogger({ name: "local", level: TRACE });

  const integrationConfig = {
    jiraUsername: process.env.JIRA_LOCAL_EXECUTION_USERNAME,
    jiraPassword: process.env.JIRA_LOCAL_EXECUTION_PASSWORD,
    jiraHost: process.env.JIRA_LOCAL_EXECUTION_HOST,
    projects: process.env.JIRA_LOCAL_EXECUTION_PROJECTS
      ? JSON.parse(process.env.JIRA_LOCAL_EXECUTION_PROJECTS)
      : [],
  };

  const invocationArgs = {
    // providerPrivateKey: process.env.PROVIDER_LOCAL_EXECUTION_PRIVATE_KEY
  };

  logger.info(
    await executeSingleHandlerLocal(
      integrationConfig,
      logger,
      executionHandler,
      invocationArgs,
      createLocalInvocationEvent(),
    ),
    "Execution completed successfully!",
  );
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
