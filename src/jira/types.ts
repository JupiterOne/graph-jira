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

export interface Resource {
  id: string;
}

export interface Project extends Resource {
  self: string;
  key: string;
  name: string;
  avatarUrls: {
    [size: string]: string;
  };
  projectTypeKey: string;
  simplified: boolean;
  style: string;
  isPrivate: boolean;
  url: string;
}

export interface User extends Resource {
  self: string;
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

export interface Issue extends Resource {
  self: string;
  key: string;
  fields: {
    issuetype: IssueType;
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

interface IssueType {
  name: string;
  self: string;
}
