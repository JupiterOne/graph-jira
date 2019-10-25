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
  key: string;
}

export interface Project extends Resource {
  self: string;
  id: string;
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

export interface Component {
  self: string;
  id: string;
  name: string;
  description: string;
}

export interface TextContent {
  type: "doc" | "codeBlock" | "text" | "paragraph" | "mention";
  attrs?: {
    id?: string;
    text?: string;
    language?: string;
  };
  content?: TextContent[];
  text?: string;
  marks?: object[];
}

export interface Issue extends Resource {
  self: string;
  id: string;
  fields: {
    issuetype: IssueType;
    project: Project;
    created: string;
    updated: string | null;
    resolutiondate: string | null;
    duedate: string | null;
    resolution: string | null;
    labels: string[];
    components: Component[];
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
    description: TextContent;
    subtasks: Issue[];
  };
}

interface IssueType {
  name: string;
  self: string;
}
