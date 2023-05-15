import { Issue, IssueTransition, JiraClient } from './jira';
import largeAdf from '../test/fixtures/large-adf.json';

process.env.JUPITERONE_ENVIRONMENT = 'jupiterone-test';
import {
  CreateIssueActionProperties,
  TransitionIssueActionProperties,
  createJiraIssue,
  transitionJiraIssue,
} from './actions';

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

describe.each([[{ storedActionData: false }], [{ storedActionData: true }]])(
  'createJiraIssue',
  ({ storedActionData }) => {
    const projectKey = 'PROJ';
    const projectId = 123456;

    const createdIssue: Issue = { key: 'PROJ-1' } as any;
    const foundIssue: Issue = { key: 'PROJ-1' } as any;

    const mockJiraClient = {} as any;
    const mockS3Client = {} as any;
    let actionProperties: Omit<
      CreateIssueActionProperties & { storedActionData: false },
      'storedActionData'
    >;

    function getActionPropertiesToPass(): CreateIssueActionProperties {
      return storedActionData
        ? { storedActionData, actionDataS3Key: 'action/data/key' }
        : { storedActionData, ...actionProperties };
    }

    beforeEach(() => {
      mockJiraClient.apiVersion = '3';
      mockJiraClient.projectKeyToProjectId = jest
        .fn()
        .mockResolvedValueOnce(123456);
      mockJiraClient.addNewIssue = jest
        .fn()
        .mockResolvedValueOnce(createdIssue);
      mockJiraClient.findIssue = jest.fn().mockResolvedValueOnce(foundIssue);
      mockJiraClient.addAttachmentOnIssue = jest.fn().mockResolvedValueOnce({});

      mockS3Client.getObject = jest.fn().mockImplementation(() => ({
        promise: () =>
          Promise.resolve({
            Body: JSON.stringify(actionProperties),
          }),
      }));

      actionProperties = {
        classification: 'Task',
        project: String(projectId),
        summary: 'The Summary',
        additionalFields: { description: issueDescriptionADF },
      };
    });

    afterEach(() => {
      if (storedActionData) {
        expect(mockS3Client.getObject).toHaveBeenCalledWith({
          Bucket: 'jupiterone-test-jupiter-integration-jira-actions',
          Key: 'action/data/key',
        });
        expect(mockS3Client.getObject).toHaveBeenCalledTimes(1);
      } else {
        expect(mockS3Client.getObject).toHaveBeenCalledTimes(0);
      }

      jest.resetAllMocks();
    });

    test('uses project ID as provided', async () => {
      actionProperties.project = String(projectId);
      const issue = await createJiraIssue(mockJiraClient, mockS3Client, {
        properties: getActionPropertiesToPass(),
      });

      expect(mockJiraClient.projectKeyToProjectId).not.toHaveBeenCalled();
      expect(mockJiraClient.addNewIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId,
        }),
      );

      expect(issue).toBe(foundIssue);
    });

    test('converts project key to project ID', async () => {
      actionProperties.project = projectKey;
      const issue = await createJiraIssue(mockJiraClient, mockS3Client, {
        properties: getActionPropertiesToPass(),
      });

      expect(mockJiraClient.projectKeyToProjectId).toHaveBeenCalledWith(
        projectKey,
      );
      expect(mockJiraClient.addNewIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId,
        }),
      );

      expect(issue).toBe(foundIssue);
    });

    test('uses description ADF for V3 API', async () => {
      mockJiraClient.apiVersion = 3;

      const issue = await createJiraIssue(mockJiraClient, mockS3Client, {
        properties: getActionPropertiesToPass(),
      });

      expect(mockJiraClient.addNewIssue).toHaveBeenCalledWith({
        projectId,
        issueTypeName: actionProperties.classification,
        summary: actionProperties.summary,
        additionalFields: {
          description: issueDescriptionADF,
        },
      });

      expect(mockJiraClient.findIssue).toHaveBeenCalledWith(createdIssue.key);
      expect(issue).toBe(foundIssue);
    });

    test('converts description ADF for V2 API', async () => {
      mockJiraClient.apiVersion = '2';

      const issue = await createJiraIssue(mockJiraClient, mockS3Client, {
        properties: getActionPropertiesToPass(),
      });

      expect(mockJiraClient.addNewIssue).toHaveBeenCalledWith({
        projectId,
        issueTypeName: actionProperties.classification,
        summary: actionProperties.summary,
        additionalFields: {
          description: issueDescriptionText,
        },
      });

      expect(mockJiraClient.findIssue).toHaveBeenCalledWith(createdIssue.key);
      expect(issue).toBe(foundIssue);
    });

    test('does not try to create an attachment for a normal sized description', async () => {
      mockJiraClient.apiVersion = '3';

      const issue = await createJiraIssue(mockJiraClient, mockS3Client, {
        properties: getActionPropertiesToPass(),
      });

      // Should not create attachments unless absolutely necessary
      expect(mockJiraClient.addAttachmentOnIssue).not.toHaveBeenCalled();
      expect(issue).toBe(foundIssue);
    });

    test('should add the description as an attachment if it is too large', async () => {
      mockJiraClient.apiVersion = '3';
      actionProperties.additionalFields = { description: largeAdf };

      const issue = await createJiraIssue(mockJiraClient, mockS3Client, {
        properties: getActionPropertiesToPass(),
      });
      expect(mockJiraClient.addAttachmentOnIssue).toHaveBeenCalled();

      // Should not create attachments unless absolutely necessary
      expect(mockJiraClient.addAttachmentOnIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          issueId: createdIssue.id,
          attachmentContent: expect.any(String),
        }),
      );
      expect(issue).toBe(foundIssue);
    });
  },
);

describe(transitionJiraIssue, () => {
  const mockJiraClient = {} as JiraClient;

  const issueKey = 'PROJ-42';
  const transitionId = '42';

  test('should find transition by transition name and send', async () => {
    const transition: IssueTransition = {
      id: transitionId,
      name: 'Answer',
    } as any;

    const mockIssue = { transitions: [transition] };

    mockJiraClient.findIssue = jest.fn().mockResolvedValueOnce(mockIssue);
    mockJiraClient.transitionIssue = jest
      .fn()
      .mockResolvedValueOnce(Promise.resolve());

    const actionProperties: TransitionIssueActionProperties = {
      issueKey,
      transitionName: transition.name,
    };

    const issue = await transitionJiraIssue(mockJiraClient, {
      properties: actionProperties,
    });

    expect(mockJiraClient.findIssue).toHaveBeenCalledWith(issueKey);
    expect(mockJiraClient.transitionIssue).toHaveBeenCalledWith({
      issueId: issueKey,
      transitionName: transition.name,
      statusName: undefined,
    });

    expect(issue).toBe(mockIssue);
  });

  test('should find transition by target status name and send', async () => {
    const transition = {
      id: transitionId,
      name: 'Answer',
      to: {
        name: 'Answered',
      },
    } as IssueTransition;

    const mockIssue = { transitions: [transition] };

    mockJiraClient.findIssue = jest.fn().mockResolvedValueOnce(mockIssue);
    mockJiraClient.transitionIssue = jest
      .fn()
      .mockResolvedValueOnce(Promise.resolve());

    const actionProperties: TransitionIssueActionProperties = {
      issueKey,
      statusName: transition.to.name,
    };

    const issue = await transitionJiraIssue(mockJiraClient, {
      properties: actionProperties,
    });

    expect(mockJiraClient.findIssue).toHaveBeenCalledWith(issueKey);
    expect(mockJiraClient.transitionIssue).toHaveBeenCalledWith({
      issueId: issueKey,
      transitionName: undefined,
      statusName: transition.to.name,
    });

    expect(issue).toBe(mockIssue);
  });

  test('should throw if transition target status not found', async () => {
    const transition = {
      id: transitionId,
      name: 'Answer',
      to: {
        name: 'Answered',
      },
    } as IssueTransition;

    const mockIssue = { transitions: [transition] };

    mockJiraClient.transitionIssue = JiraClient.prototype.transitionIssue;
    mockJiraClient['client'] = {
      findIssue: jest.fn().mockResolvedValueOnce(mockIssue),
    } as any;

    const actionProperties: TransitionIssueActionProperties = {
      issueKey,
      statusName: 'Not Answered',
    };

    await expect(
      transitionJiraIssue(mockJiraClient, {
        properties: actionProperties,
      }),
    ).rejects.toThrow(
      `Unable to find transition for issue ${issueKey} to status "${actionProperties.statusName}"`,
    );
  });

  test('should throw if transition name not found', async () => {
    const transition = {
      id: transitionId,
      name: 'Answer',
      to: {
        name: 'Answered',
      },
    } as IssueTransition;

    const mockIssue = { transitions: [transition] };

    mockJiraClient.transitionIssue = JiraClient.prototype.transitionIssue;
    mockJiraClient['client'] = {
      findIssue: jest.fn().mockResolvedValueOnce(mockIssue),
    } as any;

    const actionProperties: TransitionIssueActionProperties = {
      issueKey,
      transitionName: 'Not Answer',
    };

    await expect(
      transitionJiraIssue(mockJiraClient, {
        properties: actionProperties,
      }),
    ).rejects.toThrow(
      `Unable to find transition for issue ${issueKey} named "${actionProperties.transitionName}"`,
    );
  });
});
