import JiraApi from "jira-client";

import { Issue, Project, ServerInfo, User } from "./types";

interface JiraParams {
  host: string;
  password: string;
  username: string;
}

export default class JiraClient {
  private client: JiraApi;
  private host: string;
  private username: string;
  private password: string;

  constructor(params: JiraParams) {
    this.host = params.host;
    this.username = params.username;
    this.password = params.password;
  }

  public async authenticate() {
    this.client = new JiraApi({
      protocol: "https",
      host: this.host,
      username: this.username,
      password: this.password,
      apiVersion: "3",
      strictSSL: true,
    });
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
