import JiraClient from "./JiraClient";
import { JiraDataModel } from "./types";

interface ProjectKey {
  key: string;
}

export default async function fetchJiraData(
  client: JiraClient,
  configProjects: ProjectKey[],
): Promise<JiraDataModel> {
  const [projects, serverInfo, users] = await Promise.all([
    client.fetchProjects(),
    client.fetchServerInfo(),
    client.fetchUsers(),
  ]);

  const fetchedProjectsKeys: ProjectKey[] =
    projects && projects.map(project => ({ key: project.name }));

  const projectsToIngest: ProjectKey[] =
    configProjects && configProjects.length > 0
      ? configProjects
      : fetchedProjectsKeys;

  const projectIssues = await Promise.all(
    projectsToIngest.map((item: ProjectKey) => client.fetchIssues(item.key)),
  );

  const issues =
    projectIssues &&
    projectIssues.reduce((acc, value) => {
      return acc.concat(value);
    }, []);

  return { projects, serverInfo, users, issues };
}
