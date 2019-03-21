import {
  IntegrationExecutionContext,
  IntegrationInvocationEvent,
} from "@jupiterone/jupiter-managed-integration-sdk";
import JiraClient from "./JiraClient";

export default function createJiraClient(
  context: IntegrationExecutionContext<IntegrationInvocationEvent>,
) {
  const {
    instance: { config },
  } = context;

  return new JiraClient({
    host: config.host,
    username: config.jiraLogin,
    password: config.jiraPassword,
  });
}
