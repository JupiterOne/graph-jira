import { IntegrationValidationError } from '@jupiterone/integration-sdk-core';
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
import { JiraIntegrationInstanceConfig, validateInvocation } from './config';

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
    let error: any;
    try {
      await validateInvocation(context as any);
    } catch (err) {
      error = err;
    }
    expect(error).not.toBeUndefined();
    expect(error.message).toEqual(
      'The Host config value must be a valid Jira host string (ex: example.com, example.com:2913, example.com/base, http://subdomain.example.com)',
    );
    expect(error).toBeInstanceOf(IntegrationValidationError);
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

    let error: any;
    try {
      await validateInvocation(executionContext);
    } catch (err) {
      error = err;
    }
    expect(error).not.toBeUndefined();
    expect(error.message).toMatch(
      /^There is a problem with the Jira credentials configuration/,
    );
    expect(error).toBeInstanceOf(IntegrationValidationError);
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

    let error: any;
    try {
      await validateInvocation(executionContext);
    } catch (err) {
      error = err;
    }
    expect(error).not.toBeUndefined();
    expect(error.message).toMatch(
      /^There is a problem with the Jira credentials configuration/,
    );
    expect(error).toBeInstanceOf(IntegrationValidationError);
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

    let error: any;
    try {
      await validateInvocation(executionContext);
    } catch (err) {
      error = err;
    }
    expect(error).not.toBeUndefined();
    expect(error.message).toEqual(
      'There is a problem with the Jira configuration, the project key(s) are invalid: ["INVALID"]. Ensure the authenticated user has access to this project.',
    );
    expect(error).toBeInstanceOf(IntegrationValidationError);
  });
});
