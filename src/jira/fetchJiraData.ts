import { ProjectConfig } from "../types";
import JiraClient from "./JiraClient";
import { JiraDataModel } from "./types";

export default async function fetchJiraData(
  client: JiraClient,
  configProjects: ProjectConfig[],
): Promise<JiraDataModel> {
  const [projects, serverInfo, users] = await Promise.all([
    client.fetchProjects(),
    client.fetchServerInfo(),
    client.fetchUsers(),
  ]);

  const fetchedProjectsKeys: ProjectConfig[] = projects.map(project => ({
    key: project.name,
  }));

  const projectsToIngest: ProjectConfig[] =
    configProjects.length > 0 ? configProjects : fetchedProjectsKeys;

  const projectIssues = await Promise.all(
    projectsToIngest.map((item: ProjectConfig) => client.fetchIssues(item.key)),
  );

  const issues = projectIssues.reduce((acc, value) => {
    return acc.concat(value);
  }, []);

  return { projects, serverInfo, users, issues };
}
