import {
  IntegrationProviderAuthenticationError,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';
import {
  createMockExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';

import {
  integrationInstanceConfig,
  localServerInstanceConfig,
  normalizedInstanceConfig,
} from '../test/config';
import { setupJiraRecording } from '../test/recording';
import {
  buildJiraHostConfig,
  isValidJiraHost,
  JiraHostConfig,
  JiraIntegrationInstanceConfig,
  validateInvocation,
} from './config';

describe(validateInvocation, () => {
  let recording: Recording;

  afterEach(async () => {
    if (recording) await recording.stop();
  });

  test('empty instance config', async () => {
    const executionContext = createMockExecutionContext({
      instanceConfig: {} as JiraIntegrationInstanceConfig,
    });

    await expect(validateInvocation(executionContext)).rejects.toThrow(
      IntegrationValidationError,
    );
  });

  test('invalid jiraHost', async () => {
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

  test('invalid credentials (cloud server)', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'validateInvocationCloudInvalidPassword',
      options: {
        recordFailedRequests: true,
      },
    });

    const executionContext =
      createMockExecutionContext<JiraIntegrationInstanceConfig>({
        instanceConfig: {
          ...integrationInstanceConfig,
          jiraPassword: 'invalid',
        },
      });

    await expect(validateInvocation(executionContext)).rejects.toThrow(
      IntegrationProviderAuthenticationError,
    );
  });

  test('valid credentials (cloud server)', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'validateInvocationCloud',
    });

    const executionContext =
      createMockExecutionContext<JiraIntegrationInstanceConfig>({
        instanceConfig: integrationInstanceConfig,
      });

    await expect(validateInvocation(executionContext)).resolves.not.toThrow();
  });

  test('invalid credentials (local server)', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'validateInvocationLocalInvalidPassword',
      options: {
        recordFailedRequests: true,
      },
    });

    const executionContext = createMockExecutionContext({
      instanceConfig: { ...localServerInstanceConfig, jiraUsername: 'invalid' },
    });

    await expect(validateInvocation(executionContext)).rejects.toThrow(
      IntegrationProviderAuthenticationError,
    );
  });

  test('valid credentials (local server)', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'validateInvocationLocal',
      options: {
        recordFailedRequests: true,
      },
    });

    const executionContext = createMockExecutionContext({
      instanceConfig: localServerInstanceConfig,
    });

    await expect(validateInvocation(executionContext)).resolves.not.toThrow();
  });

  test('mutates instance.config to normalized values', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'validateInvocation',
    });

    const executionContext =
      createMockExecutionContext<JiraIntegrationInstanceConfig>({
        instanceConfig: integrationInstanceConfig,
      });

    await expect(validateInvocation(executionContext)).resolves.not.toThrow();

    expect(executionContext.instance.config).toEqual(normalizedInstanceConfig);
  });

  test('invalid projects', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'validateInvocationInvalidProject',
    });

    const executionContext =
      createMockExecutionContext<JiraIntegrationInstanceConfig>({
        instanceConfig: { ...integrationInstanceConfig, projects: ['INVALID'] },
      });

    await expect(validateInvocation(executionContext)).rejects.toThrow(
      'The following project key(s) are invalid: ["INVALID"]. Ensure the authenticated user has access to this project.',
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

  test('single node base', () => {
    expect(isValidJiraHost('fake-hostname.atlassian.net/subdir')).toBe(true);
  });

  // TODO: Verify this cannot be multiple nodes
  test('multiple node base', () => {
    expect(
      isValidJiraHost('fake-hostname.atlassian.net/subdir/anothaone'),
    ).toBe(false);
  });
});

describe(buildJiraHostConfig, () => {
  test('localhost', () => {
    expect(buildJiraHostConfig('localhost')).toMatchObject({
      protocol: 'https',
      host: 'localhost',
      port: '443',
      base: undefined,
    } as JiraHostConfig);
  });

  test('localhost/something', () => {
    expect(buildJiraHostConfig('localhost/something')).toMatchObject({
      protocol: 'https',
      host: 'localhost',
      port: '443',
      base: 'something',
    } as JiraHostConfig);
  });

  test('localhost:8080', () => {
    expect(buildJiraHostConfig('localhost:8080')).toMatchObject({
      protocol: 'https',
      host: 'localhost',
      port: '8080',
      base: undefined,
    } as JiraHostConfig);
  });

  test('http://localhost:8080', () => {
    expect(buildJiraHostConfig('http://localhost:8080')).toMatchObject({
      protocol: 'http',
      host: 'localhost',
      port: '8080',
      base: undefined,
    } as JiraHostConfig);
  });

  test('http://localhost:8080/base', () => {
    expect(buildJiraHostConfig('http://localhost:8080')).toMatchObject({
      protocol: 'http',
      host: 'localhost',
      port: '8080',
      base: undefined,
    } as JiraHostConfig);
  });
});
