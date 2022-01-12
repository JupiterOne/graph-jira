import { JiraHostConfig } from './types';
import { buildJiraHostConfig, isValidJiraHost } from './util';

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

  test('protocol http', () => {
    expect(isValidJiraHost('http://fake-hostname.atlassian.net')).toBe(true);
  });

  test('protocol https', () => {
    expect(isValidJiraHost('https://fake-hostname.atlassian.net')).toBe(true);
  });

  test('protocol ftp', () => {
    expect(isValidJiraHost('ftp://fake-hostname.atlassian.net')).toBe(false);
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

  test('https://localhost', () => {
    expect(buildJiraHostConfig('https://localhost')).toMatchObject({
      protocol: 'https',
      host: 'localhost',
      port: '443',
      base: undefined,
    } as JiraHostConfig);
  });

  test('https://localhost:8080', () => {
    expect(buildJiraHostConfig('https://localhost:8080')).toMatchObject({
      protocol: 'https',
      host: 'localhost',
      port: '8080',
      base: undefined,
    } as JiraHostConfig);
  });
});
