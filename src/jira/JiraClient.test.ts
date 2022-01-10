import 'jest-extended';

import JiraApi from 'jira-client';

import {
  createMockIntegrationLogger,
  Recording,
} from '@jupiterone/integration-sdk-testing';

import { normalizedInstanceConfig } from '../../test/config';
import { setupJiraRecording } from '../../test/recording';
import { JiraClient } from './JiraClient';

jest.setTimeout(10000);

const logger = createMockIntegrationLogger();
const client = new JiraClient(logger, new JiraApi(normalizedInstanceConfig));

describe(JiraClient, () => {
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

    const createdIssue = await client.addNewIssue('Test Issue', 10000, 'Task');

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
