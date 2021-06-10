export interface ProjectConfig {
  key: string;
}

export interface CreateIssueActionProperties {
  /**
   * The key of the issue project.
   */
  project: string;
  summary: string;
  classification: string;
  additionalFields?: object;
}
