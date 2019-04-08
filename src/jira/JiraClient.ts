import JiraApi from "jira-client";

import { Issue, Project, ServerInfo, User } from "./types";

interface JiraParams {
  host: string;
  password: string;
  username: string;
}

type IssueTypeName =
  | "Epic"
  | "Improvement"
  | "Task"
  | "Sub-task"
  | "New Feature";

export default class JiraClient {
  private client: JiraApi;

  constructor(params: JiraParams) {
    const { host, username, password } = params;
    this.client = new JiraApi({
      protocol: "https",
      host,
      username,
      password,
      apiVersion: "3",
      strictSSL: true,
    });
  }

  public async addNewIssue(
    summary: string,
    projectId: number,
    issueTypeName: IssueTypeName,
  ): Promise<Issue> {
    const issue: Issue = (await this.client.addNewIssue({
      fields: {
        summary,
        project: {
          id: projectId,
        },
        issuetype: {
          name: issueTypeName,
        },
      },
    })) as Issue;
    return issue;
  }

  public async findIssue(issueIdOrKey: string): Promise<Issue> {
    const issue: Issue = (await this.client.findIssue(issueIdOrKey)) as Issue;
    return issue;
  }

  public async fetchProjects(): Promise<Project[]> {
    const projects: Project[] = (await this.client.listProjects()) as Project[];
    return projects;
  }

  public async fetchServerInfo(): Promise<ServerInfo> {
    // @ts-ignore: calling private method
    const info: ServerInfo = (await this.client.getServerInfo()) as ServerInfo;
    return info;
  }

  public async fetchIssues(project: string): Promise<Issue[]> {
    if (!project) {
      return [] as Issue[];
    }

    let issues: Issue[] = [];
    let resultLength = 0;

    do {
      const response = await this.client.searchJira(`project='${project}'`, {
        startAt: issues.length,
      });

      const paginatedIssues = response.issues || [];
      issues = issues.concat(paginatedIssues);
      resultLength = paginatedIssues.length;
    } while (resultLength > 0);

    return issues;
  }

  public async fetchUsers(): Promise<User[]> {
    let users: User[] = [];
    let resultLength = 0;

    do {
      const paginatedUsers: User[] = (await this.client.searchUsers({
        startAt: users.length,
        username: "",
        includeInactive: true,
      })) as User[];

      users = users.concat(paginatedUsers);
      resultLength = paginatedUsers.length;
    } while (resultLength > 0);

    return users;
  }
}
