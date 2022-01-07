import nock from 'nock';

import {
  IntegrationProviderAuthenticationError,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';
import {
  createMockExecutionContext,
  setupRecording,
} from '@jupiterone/integration-sdk-testing';

import { integrationInstanceConfig } from '../test/config';
import {
  buildNormalizedInstanceConfig,
  IntegrationConfig,
  isValidJiraHost,
  JiraIntegrationInstanceConfig,
  validateInvocation,
} from './config';

function buildInstanceConfig(
  overrides?: Partial<JiraIntegrationInstanceConfig>,
): JiraIntegrationInstanceConfig {
  return {
    jiraHost: 'example.com',
    jiraUsername: 'testLogin',
    jiraPassword: 'testPassword',
    projects: [],
    ...overrides,
  };
}

describe(validateInvocation, () => {
  test('empty instance config', async () => {
    const executionContext = createMockExecutionContext({
      instanceConfig: {} as JiraIntegrationInstanceConfig,
    });

    await expect(validateInvocation(executionContext)).rejects.toThrow(
      IntegrationValidationError,
    );
  });
});

describe(isValidJiraHost, () => {
  test('localhost:8080', () => {
    expect(isValidJiraHost('localhost:8080')).toBe(true);
  });

  test('127.0.0.1:8080', () => {
    expect(isValidJiraHost('127.0.0.1:8080')).toBe(true);
  });

  test('query params', () => {
    expect(isValidJiraHost('test.com?somequeryparms')).toBe(false);
  });

  test('single node path', () => {
    expect(isValidJiraHost('fake-hostname.atlassian.net/subdir')).toBe(true);
  });

  test('multiple node path', () => {
    expect(
      isValidJiraHost('fake-hostname.atlassian.net/subdir/anothaone'),
    ).toBe(false);
  });
});

describe(buildNormalizedInstanceConfig, () => {
  test('localhost', () => {
    expect(
      buildNormalizedInstanceConfig(
        buildInstanceConfig({ jiraHost: 'localhost' }),
      ),
    ).toMatchObject({
      hostProtocol: 'https',
      hostName: 'localhost',
      hostPort: 443,
      urlBase: undefined,
    });
  });

  test('localhost/something', () => {
    expect(
      buildNormalizedInstanceConfig(
        buildInstanceConfig({ jiraHost: 'localhost/something' }),
      ),
    ).toMatchObject({
      hostProtocol: 'https',
      hostName: 'localhost',
      hostPort: 443,
      urlBase: 'something',
    });
  });

  test('localhost:8080', () => {
    expect(
      buildNormalizedInstanceConfig(
        buildInstanceConfig({ jiraHost: 'localhost:8080' }),
      ),
    ).toMatchObject({
      hostProtocol: 'https',
      hostName: 'localhost',
      hostPort: 8080,
      urlBase: undefined,
    });
  });
});

test('should throw exception if jiraHost is invalid', async () => {
  const context = {
    instance: {
      config: {
        jiraHost: 'test.com?somequeryparms',
        jiraUsername: 'testLogin',
        jiraPassword: 'testPassword',
      },
    },
  };
  await expect(validateInvocation(context as any)).rejects.toThrow(
    IntegrationValidationError,
  );
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
    instanceConfig: integrationInstanceConfig,
  });

  await expect(validateInvocation(executionContext)).rejects.toThrow(
    IntegrationProviderAuthenticationError,
  );
});

describe(validateInvocation, () => {
  beforeAll(() => {
    nock.back.fixtures = `${__dirname}/../test/fixtures/`;
    process.env.CI
      ? nock.back.setMode('lockdown')
      : nock.back.setMode('record');
  });

  test('mutates instance.config to normalized values', async () => {
    const { nockDone } = await nock.back('invocation-projects.json');

    const instanceConfig: JiraIntegrationInstanceConfig = {
      jiraHost: 'fake-hostname.atlassian.net',
      jiraUsername: 'fakeLogin',
      jiraPassword: 'fakePassword',
      projects: ['IR'],
    };

    const executionContext = {
      instance: {
        config: instanceConfig,
      },
    };

    await validateInvocation(executionContext as any);

    const normalizedConfig: IntegrationConfig = {
      ...instanceConfig,
      hostProtocol: 'https',
      hostName: 'fake-hostname.atlassian.net',
      hostPort: 443,
      urlBase: undefined,
    };

    expect(executionContext.instance.config).toEqual(normalizedConfig);

    nockDone();
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
