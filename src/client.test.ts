import { createMockIntegrationLogger } from '@jupiterone/integration-sdk-testing';

import { normalizedInstanceConfig } from '../test/config';
import { Recording, setupJiraRecording } from '../test/recording';
import { createApiClient } from './utils';

const logger = createMockIntegrationLogger();

describe('iterateIssues', () => {
  let recording: Recording;

  afterEach(async () => {
    await recording.stop();
  });

  it('should not error when the project does not exist anymore', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'iterateIssuesMissingProject',
      options: {
        recordFailedRequests: true,
        matchRequestsBy: {
          method: true,
          headers: false,
          body: false,
          order: true,
          url: {
            username: false,
            password: false,
            hostname: false,
            port: false,
            pathname: true,
            query: true,
            hash: false,
          },
        },
      },
    });

    const apiClient = createApiClient(logger, normalizedInstanceConfig);
    await expect(
      apiClient.iterateIssues('key', 100000, 10, () => undefined),
    ).resolves.not.toThrow();
  });

  it('should return true if all issues are processed', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'allIssuesIngested',
      options: {
        recordFailedRequests: true,
        matchRequestsBy: {
          method: true,
          headers: false,
          body: false,
          order: true,
          url: {
            username: false,
            password: false,
            hostname: false,
            port: false,
            pathname: true,
            query: true,
            hash: false,
          },
        },
      },
    });
    const apiClient = createApiClient(logger, normalizedInstanceConfig);
    await expect(
      apiClient.iterateIssues('JJI', 0, 100, () => undefined),
    ).resolves.toEqual(true);
  });

  it('should return false if all issues are not processed', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'notAllIssuesIngested',
      options: {
        recordFailedRequests: true,
        matchRequestsBy: {
          method: true,
          headers: false,
          body: false,
          order: true,
          url: {
            username: false,
            password: false,
            hostname: false,
            port: false,
            pathname: true,
            query: true,
            hash: false,
          },
        },
      },
    });
    const apiClient = createApiClient(logger, normalizedInstanceConfig);
    await expect(
      apiClient.iterateIssues('JJI', 0, 2, () => undefined),
    ).resolves.toEqual(false);
  });
});
