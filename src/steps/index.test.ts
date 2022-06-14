import {
  createMockStepExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';

import {
  normalizedInstanceConfig,
  normalizedLocalServerInstanceConfig,
} from '../../test/config';
import { setupJiraRecording } from '../../test/recording';
import { IntegrationConfig } from '../config';
import { fetchAccountDetails } from './account';
import { fetchIssues } from './issues';
import { fetchProjects } from './projects';
import { fetchUsers } from './users';

jest.setTimeout(10000);

let recording: Recording;

afterEach(async () => {
  await recording.stop();
});

async function testSteps(cloud: boolean = true) {
  recording = setupJiraRecording({
    directory: __dirname,
    name: 'steps' + (cloud ? 'Cloud' : 'DataCenter'),
  });

  const context = createMockStepExecutionContext<IntegrationConfig>({
    instanceConfig: cloud
      ? normalizedInstanceConfig
      : normalizedLocalServerInstanceConfig,
  });

  // Simulates dependency graph execution.
  // See https://github.com/JupiterOne/sdk/issues/262.
  await fetchAccountDetails(context);
  await fetchProjects(context);
  await fetchUsers(context);
  await fetchIssues(context);

  // Review snapshot, failure is a regression
  expect({
    numCollectedEntities: context.jobState.collectedEntities.length,
    numCollectedRelationships: context.jobState.collectedRelationships.length,
    collectedEntities: context.jobState.collectedEntities,
    collectedRelationships: context.jobState.collectedRelationships,
    encounteredTypes: context.jobState.encounteredTypes,
  }).toMatchSnapshot();

  const accounts = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Account'),
  );
  expect(accounts.length).toBeGreaterThan(0);
  expect(accounts).toMatchGraphObjectSchema({
    _class: ['Account'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'jira_account' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        webLink: cloud ? { type: 'string', format: 'url' } : { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name', 'displayName', 'webLink'],
    },
  });

  const users = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('User'),
  );
  expect(users.length).toBeGreaterThan(0);
  expect(users).toMatchGraphObjectSchema({
    _class: ['User'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'jira_user' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name', 'displayName'],
    },
  });

  const projects = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Project'),
  );
  expect(projects.length).toBeGreaterThan(0);
  expect(projects).toMatchGraphObjectSchema({
    _class: ['Project'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'jira_project' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        id: { type: 'string' },
        key: { type: 'string' }, //not the same as ._key
        webLink: cloud ? { type: 'string', format: 'url' } : { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name', 'displayName', 'id', 'key', 'webLink'],
    },
  });

  const issues = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Record'),
  );
  expect(issues.length).toBeGreaterThan(0);
  expect(issues).toMatchGraphObjectSchema({
    _class: ['Record', 'Issue'], //this could actually have more classes in some cases
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'jira_issue' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        id: { type: 'string' },
        key: { type: 'string' }, //not the same as ._key
        webLink: cloud ? { type: 'string', format: 'url' } : { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name', 'displayName', 'id', 'key', 'webLink'],
    },
  });
}

test('should collect data (cloud)', async () => {
  await testSteps(true);
});

test('should collect data (data center)', async () => {
  await testSteps(false);
});
