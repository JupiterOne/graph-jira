import 'jest-extended';

import path from 'path';

import {
  createMockIntegrationLogger,
  Recording,
  SetupRecordingInput,
} from '@jupiterone/integration-sdk-testing';

import {
  normalizedInstanceConfig,
  normalizedLocalServerInstanceConfig,
} from '../../test/config';
import { setupJiraRecording } from '../../test/recording';
import { JiraClient } from './JiraClient';

jest.setTimeout(10000);

const logger = createMockIntegrationLogger();

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

describe('JiraClient V' + normalizedInstanceConfig.apiVersion, () => {
  const client = new JiraClient(logger, normalizedInstanceConfig);

  let recording: Recording;

  afterEach(async () => {
    await recording.stop();
  });

  test('fetchServerInfo', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'fetchServerInfo',
    });
    const response = await client.fetchServerInfo();
    expect(response).toContainKeys(['baseUrl', 'serverTitle']);
  });

  test('fetchProjects', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'fetchProjects',
    });

    const response = await client.fetchProjects();
    expect(response).toBeArray();
    expect(response).not.toBeArrayOfSize(0);
    expect(response.map((value) => value.name)).toEqual([
      'BUG',
      'Jira J1 Integration',
    ]);
  });

  test('fetchUsersPage', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'fetchUsersPage',
    });

    const response = await client.fetchUsersPage();
    expect(response).toBeArray();
    expect(response).not.toBeArrayOfSize(0);
  });

  test('fetchIssuesPage', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'fetchIssuesPage',
    });

    const response = await client.fetchIssuesPage({ project: 'JJI' });
    expect(response).toBeArray();
    expect(response).not.toBeArrayOfSize(0);
  });

  test('fetchIssuesPage with sinceAtTimestamp filter', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'fetchIssuesPageSinceAtTimestamp',
    });

    const response = await client.fetchIssuesPage({
      project: 'JJI',
      sinceAtTimestamp: Date.parse('2019-04-08T12:51:50.417Z'),
    });
    expect(response).toBeArray();
    expect(response).not.toBeArrayOfSize(0);
  });

  test('fetchIssuesPage non-extant project', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'fetchIssuesPageNonExtantProject',
      options: {
        recordFailedRequests: true,
      },
    });

    await expect(
      client.fetchIssuesPage({ project: 'NotExistedProject' }),
    ).rejects.toThrow();
  });

  test('addNewIssue', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'addNewIssue',
    });

    const createdIssue = await client.addNewIssue({
      summary: 'Test Issue',
      projectId: 10000,
      issueTypeName: 'Task',
    });

    expect(createdIssue).toContainKeys(['id', 'key', 'self']);
    expect(createdIssue).not.toContainKeys([
      'parent',
      'project',
      'creator',
      'reporter',
      'fields',
    ]);

    const foundIssue = await client.findIssue(createdIssue.id);
    expect(foundIssue).toContainKeys(['id', 'key', 'self', 'fields']);
  });

  test('addNewIssue description', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'addNewIssueWithDescription',
    });

    const createdIssue = await client.addNewIssue({
      summary: 'Test Issue',
      projectId: 10000,
      issueTypeName: 'Task',
      additionalFields: { description: issueDescriptionADF },
    });

    expect(createdIssue).toContainKeys(['id', 'key', 'self']);

    const foundIssue = await client.findIssue(createdIssue.id);
    expect(foundIssue).toContainKeys(['id', 'key', 'self', 'fields']);
    expect(foundIssue.fields.description).toEqual(issueDescriptionADF);
  });

  test('#projectKeyToProjectId should return project id number if successful', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'projectKeyToProjectId',
    });

    await expect(client.projectKeyToProjectId('BUG')).resolves.toEqual(10000);
  });

  test('#projectKeyToProjectId should return null project key does not exist', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'projectKeyToProjectIdNonExtantProject',
      options: {
        recordFailedRequests: true,
      },
    });

    await expect(
      client.projectKeyToProjectId('PROJECTNAMEBAD'),
    ).rejects.toThrow(`No project could be found with key 'PROJECTNAMEBAD'`);
  });
});

describe(
  'JiraClient V' + normalizedLocalServerInstanceConfig.apiVersion,
  () => {
    const client = new JiraClient(logger, normalizedLocalServerInstanceConfig);

    let recording: Recording;

    function setupApiRecording(
      name: string,
      options?: SetupRecordingInput['options'],
    ) {
      recording = setupJiraRecording({
        directory: path.join(
          __dirname,
          `api-v${normalizedLocalServerInstanceConfig.apiVersion}`,
        ),
        name,
        options,
      });
    }

    afterEach(async () => {
      await recording.stop();
    });

    test('fetchServerInfo', async () => {
      setupApiRecording('fetchServerInfo');
      const response = await client.fetchServerInfo();
      expect(response).toContainKeys(['baseUrl', 'serverTitle']);
    });

    test('fetchProjects', async () => {
      setupApiRecording('fetchProjects');

      const response = await client.fetchProjects();
      expect(response).toBeArray();
      expect(response).not.toBeArrayOfSize(0);
      response.forEach((v) => expect(v.name).toBeString());
    });

    test('fetchUsersPage', async () => {
      setupApiRecording('fetchUsersPage');

      const response = await client.fetchUsersPage();
      expect(response).toBeArray();
      expect(response).not.toBeArrayOfSize(0);
    });

    test('fetchIssuesPage', async () => {
      setupApiRecording('fetchIssuesPage');

      const response = await client.fetchIssuesPage({
        project: normalizedLocalServerInstanceConfig.projects[0],
      });
      expect(response).toBeArray();
      expect(response).not.toBeArrayOfSize(0);
    });

    test('fetchIssuesPage with sinceAtTimestamp filter', async () => {
      setupApiRecording('fetchIssuesPageSinceAtTimestamp');

      const response = await client.fetchIssuesPage({
        project: normalizedLocalServerInstanceConfig.projects[0],
        sinceAtTimestamp: Date.parse('2019-04-08T12:51:50.417Z'),
      });
      expect(response).toBeArray();
      expect(response).not.toBeArrayOfSize(0);
    });

    test('fetchIssuesPage non-extant project', async () => {
      setupApiRecording('fetchIssuesPageNonExtantProject', {
        recordFailedRequests: true,
      });

      await expect(
        client.fetchIssuesPage({ project: 'NotExistedProject' }),
      ).rejects.toThrow();
    });

    test('addNewIssue', async () => {
      setupApiRecording('addNewIssue');

      const createdIssue = await client.addNewIssue({
        summary: 'Test Issue',
        projectId: 10000,
        issueTypeName: 'Task',
      });

      expect(createdIssue).toContainKeys(['id', 'key', 'self']);
      expect(createdIssue).not.toContainKeys([
        'parent',
        'project',
        'creator',
        'reporter',
        'fields',
      ]);

      const foundIssue = await client.findIssue(createdIssue.id);
      expect(foundIssue).toContainKeys(['id', 'key', 'self', 'fields']);
    });

    test('addNewIssue description', async () => {
      setupApiRecording('addNewIssueWithDescription');

      const createdIssue = await client.addNewIssue({
        summary: 'Test Issue',
        projectId: 10000,
        issueTypeName: 'Task',
        additionalFields: {
          description: issueDescriptionText,
        },
      });

      expect(createdIssue).toContainKeys(['id', 'key', 'self']);

      const foundIssue = await client.findIssue(createdIssue.id);
      expect(foundIssue).toContainKeys(['id', 'key', 'self', 'fields']);
      expect(foundIssue.fields.description).toEqual(issueDescriptionText);
    });

    test('#projectKeyToProjectId should return project id number if successful', async () => {
      setupApiRecording('projectKeyToProjectId');

      await expect(
        client.projectKeyToProjectId(
          normalizedLocalServerInstanceConfig.projects[0],
        ),
      ).resolves.toEqual(10000);
    });

    test('#projectKeyToProjectId should return null project key does not exist', async () => {
      setupApiRecording('projectKeyToProjectIdNonExtantProject', {
        recordFailedRequests: true,
      });

      await expect(
        client.projectKeyToProjectId('PROJECTNAMEBAD'),
      ).rejects.toThrow(`No project could be found with key 'PROJECTNAMEBAD'`);
    });
  },
);
