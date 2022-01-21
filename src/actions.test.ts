import { CreateIssueActionProperties, createJiraIssue } from './actions';
import { Issue } from './jira';

const issueDescriptionText = 'Test description';

/**
 * The value of the `description` field for Jira API V3.
 */
const issueDescriptionADF = {
  version: 1,
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: issueDescriptionText,
        },
      ],
    },
  ],
};

describe('createJiraIssue', () => {
  const projectKey = 'PROJ';
  const projectId = 123456;

  const createdIssue: Issue = { key: 'PROJ-1' } as any;
  const foundIssue: Issue = { key: 'PROJ-1' } as any;

  const mockClient = {} as any;
  const actionProperties: CreateIssueActionProperties = {
    classification: 'Task',
    project: String(projectId),
    summary: 'The Summary',
    additionalFields: { description: issueDescriptionADF },
  };

  beforeEach(() => {
    mockClient.apiVersion = '3';
    mockClient.projectKeyToProjectId = jest.fn().mockResolvedValueOnce(123456);
    mockClient.addNewIssue = jest.fn().mockResolvedValueOnce(createdIssue);
    mockClient.findIssue = jest.fn().mockResolvedValueOnce(foundIssue);
  });

  test('uses project ID as provided', async () => {
    const issue = await createJiraIssue(mockClient, {
      properties: { ...actionProperties, project: String(projectId) },
    });

    expect(mockClient.projectKeyToProjectId).not.toHaveBeenCalled();
    expect(mockClient.addNewIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId,
      }),
    );

    expect(issue).toBe(foundIssue);
  });

  test('converts project key to project ID', async () => {
    const issue = await createJiraIssue(mockClient, {
      properties: { ...actionProperties, project: projectKey },
    });

    expect(mockClient.projectKeyToProjectId).toHaveBeenCalledWith(projectKey);
    expect(mockClient.addNewIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId,
      }),
    );

    expect(issue).toBe(foundIssue);
  });

  test('uses description ADF for V3 API', async () => {
    mockClient.apiVersion = 3;

    const issue = await createJiraIssue(mockClient, {
      properties: actionProperties,
    });

    expect(mockClient.addNewIssue).toHaveBeenCalledWith({
      projectId,
      issueTypeName: actionProperties.classification,
      summary: actionProperties.summary,
      additionalFields: {
        description: issueDescriptionADF,
      },
    });

    expect(mockClient.findIssue).toHaveBeenCalledWith(createdIssue.key);
    expect(issue).toBe(foundIssue);
  });

  test('converts description ADF for V2 API', async () => {
    mockClient.apiVersion = '2';

    const issue = await createJiraIssue(mockClient, {
      properties: actionProperties,
    });

    expect(mockClient.addNewIssue).toHaveBeenCalledWith({
      projectId,
      issueTypeName: actionProperties.classification,
      summary: actionProperties.summary,
      additionalFields: {
        description: issueDescriptionText,
      },
    });

    expect(mockClient.findIssue).toHaveBeenCalledWith(createdIssue.key);
    expect(issue).toBe(foundIssue);
  });
});
