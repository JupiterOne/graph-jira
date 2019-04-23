/* tslint:disable:no-console */
import { executeIntegrationLocal } from "@jupiterone/jupiter-managed-integration-sdk";

import jiraIntegration from "../src/index";

const integrationConfig = {
  jiraUsername: process.env.JIRA_LOCAL_EXECUTION_USERNAME,
  jiraPassword: process.env.JIRA_LOCAL_EXECUTION_PASSWORD,
  jiraHost: process.env.JIRA_LOCAL_EXECUTION_HOST,
  projects: process.env.JIRA_LOCAL_EXECUTION_PROJECTS
    ? JSON.parse(process.env.JIRA_LOCAL_EXECUTION_PROJECTS)
    : [],
};

executeIntegrationLocal(integrationConfig, jiraIntegration, {}).catch(err => {
  console.error(err);
  process.exit(1);
});
