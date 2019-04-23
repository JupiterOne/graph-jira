import JiraClient from "./JiraClient";

export default function createJiraClient(config: any) {
  return new JiraClient({
    host: config.jiraHost,
    username: config.jiraUsername,
    password: config.jiraPassword,
  });
}
