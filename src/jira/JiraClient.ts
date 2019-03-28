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
    projectId: string,
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
    const response =
      (project && (await this.client.searchJira(`project='${project}'`))) || {};
    const issues: Issue[] = (response.issues as Issue[]) || [];
    return issues;
  }

  public async fetchUsers(): Promise<User[]> {
    const users: User[] = (await this.client.searchUsers({
      username: "",
      includeInactive: true,
      maxResults: 1000,
    })) as User[];
    return users;
  }
}
