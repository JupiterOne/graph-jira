import {
  IntegrationProviderAuthenticationError,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';
import {
  createMockExecutionContext,
  setupRecording,
} from '@jupiterone/integration-sdk-testing';
import { integrationConfig } from '../test/config';
import { IntegrationConfig, validateInvocation } from './config';
import nock from 'nock';

jest.setTimeout(10000);

it('requires valid config', async () => {
  const executionContext = createMockExecutionContext<IntegrationConfig>({
    instanceConfig: {} as IntegrationConfig,
  });

  await expect(validateInvocation(executionContext)).rejects.toThrow(
    IntegrationValidationError,
  );
});

test('should throw exception if jiraHost has invalid chars', async () => {
  const context = {
    instance: {
      config: {
        jiraHost: 'test.com?somequeryparms',
        jiraUsername: 'testLogin',
        jiraPassword: 'testPassword',
      },
    },
  };
  expect.assertions(1);
  try {
    await validateInvocation(context as any);
  } catch (err) {
    expect(err instanceof IntegrationValidationError).toBeTruthy();
  }
});

test('should throw auth error not instanceConfigError if jiraHost has a subdir', async () => {
  const context = {
    instance: {
      config: {
        jiraHost: 'test.com/subdir',
        jiraUsername: 'testLogin',
        jiraPassword: 'testPassword',
      },
    },
  };
  try {
    await validateInvocation(context as any);
  } catch (e) {
    expect(e instanceof IntegrationProviderAuthenticationError).toBe(true);
  }
});

it('auth error', async () => {
  const recording = setupRecording({
    directory: '__recordings__',
    name: 'client-auth-error',
  });

  recording.server.any().intercept((req, res) => {
    res.status(401);
  });

  const executionContext = createMockExecutionContext({
    instanceConfig: integrationConfig,
  });

  await expect(validateInvocation(executionContext)).rejects.toThrow(
    IntegrationProviderAuthenticationError,
  );
});

describe('projects', () => {
  beforeAll(() => {
    nock.back.fixtures = `${__dirname}/../test/fixtures/`;
    process.env.CI
      ? nock.back.setMode('lockdown')
      : nock.back.setMode('record');
  });

  test('valid projects', async () => {
    const { nockDone } = await nock.back('invocation-projects.json');

    const executionContext = {
      instance: {
        config: {
          jiraHost: 'fake-hostname.atlassian.net',
          jiraUsername: 'fakeLogin',
          jiraPassword: 'fakePassword',
          projects: ['IR'],
        },
      },
    };

    const result = await validateInvocation(executionContext as any);

    expect(result).toBeUndefined();
    nockDone();
  });

  test('invalid projects', async () => {
    const { nockDone } = await nock.back('invocation-projects.json');

    const executionContext = {
      instance: {
        config: {
          jiraHost: 'fake-hostname.atlassian.net',
          jiraUsername: 'fakeLogin',
          jiraPassword: 'fakePassword',
          projects: ['INVALID_PROJECT'],
        },
      },
    };

    try {
      await validateInvocation(executionContext as any);
    } catch (e) {
      expect(e.message).toMatch(
        'The following project key(s) are invalid: ["INVALID_PROJECT"]. Ensure the authenticated user has access to this project.',
      );
    }
    nockDone();
  });
});
