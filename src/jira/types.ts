export interface JiraDataModel {
  serverInfo: ServerInfo;
  projects: Project[];
  users: User[];
  issues: Issue[];
}

export interface ServerInfo {
  baseUrl: string;
  version: string;
  versionNumbers: number[];
  buildNumber: number;
  buildDate: string;
  serverTime: string;
  scmInfo: string;
  serverTitle: string;
}

export interface Project {
  self: string;
  id: string;
  key: string;
  name: string;
  avatarUrls: {
    [size: string]: string;
  };
  projectTypeKey: string;
  simplified: boolean;
  style: string;
  isPrivate: boolean;
}

export interface User {
  self: string;
  id: string;
  key: string;
  name: string;
  avatarUrls: {
    [size: string]: string;
  };
  active: boolean;
  accountId: string;
  emailAddress: string;
  displayName: string;
  timeZone: string;
  locale?: string;
}

export interface Issue {
  id: string;
  self: string;
  key: string;
  fields: {
    issuetype: {
      name: string;
      self: string;
    };
    project: Project;
    created: string;
    labels: string[];
    priority: {
      name: string;
      id: string;
    };
    status: {
      self: string;
      description: string;
      name: string;
      key: string;
      colorName: string;
      id: string;
      statusCategory?: {
        self: string;
        id: string;
        key: string;
        colorName: string;
        name: string;
      };
    };
    creator: User;
    reporter: User;
    assignee?: User;
    summary: string;
    subtasks: Issue[];
  };
}
