import { JiraApiOptions } from 'jira-client';

export interface CreateIssueActionProperties {
  /**
   * The key of the issue project.
   */
  project: string;
  summary: string;
  classification: IssueTypeName;
  additionalFields?: object;
}

export type IssueTypeName =
  | 'Epic'
  | 'Improvement'
  | 'Task'
  | 'Sub-task'
  | 'New Feature';

export type JiraApiVersion = '2' | '3';
export const KNOWN_JIRA_API_VERSIONS: JiraApiVersion[] = ['3', '2'];

/**
 * `JiraApi` configuration values extracted from a Jira host configuration
 * string.
 */
export type JiraHostConfig = Required<
  Pick<JiraApiOptions, 'protocol' | 'host' | 'port'>
> & {
  base: string | undefined;
};

/**
 * A complete set of required `JiraApi` configuration values.
 */
export type JiraClientConfig = JiraHostConfig &
  Required<Pick<JiraApiOptions, 'username' | 'password'>> & {
    apiVersion: JiraApiVersion;
  };

export interface PaginationOptions {
  startAt?: number;
  pageSize?: number;
}

export interface IssuesOptions extends PaginationOptions {
  project: string;
  sinceAtTimestamp?: number;
}

export interface ServerInfo {
  baseUrl: string;
  version: string;
  versionNumbers: number[];
  buildNumber: number;
  buildDate: string;
  deploymentType: 'Cloud' | 'Server';
  serverTime: string;
  scmInfo: string;
  serverTitle: string;
}

export interface Resource {
  key: string;
}

export interface FieldSchema {
  type: string;
  system?: string;
  custom?: string;
  customId?: string;
}

export interface Field extends Resource {
  id: string;
  name: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames: string[];
  schema?: FieldSchema;
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

export interface User {
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
  accountType?: string; // e.g. 'atlassian' or 'customer'
}

export interface Component {
  self: string;
  id: string;
  name: string;
  description: string;
}

export interface TextMark {
  type: string;
  attrs?: {
    href: string;
  };
}

export interface TextContent {
  type:
    | 'doc'
    | 'codeBlock'
    | 'text'
    | 'paragraph'
    | 'mention'
    | 'inlineCard'
    | 'hardBreak'
    | 'blockquote'
    | 'panel'
    | 'emoji'
    | 'bulletList'
    | 'listItem'
    | 'table'
    | 'tableRow'
    | 'tableCell';
  attrs?: {
    id?: string;
    text?: string;
    language?: string;
    url?: string;
    panelType?: string;
    shortName?: string;
    isNumberColumnEnabled?: boolean;
    layout?: string;
  };
  content?: TextContent[];
  text?: string;
  marks?: TextMark[];
}

export interface Issue extends Resource {
  self: string;
  id: string;
  expand: string;
  fields: {
    [k: string]: any;
    issuetype: IssueType;
    project: Project;
    created: string;
    updated: string | null;
    resolutiondate: string | null;
    duedate: string | null;
    resolution: {
      name: string;
    } | null;
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
    reporter?: User;
    assignee?: User;
    summary: string;
    description: TextContent;
    subtasks: Issue[];
    customfield?: any;
  };
}

interface IssueType {
  name: string;
  self: string;
}
