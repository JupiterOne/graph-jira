import { Recording } from '@jupiterone/integration-sdk-testing';

import {
  normalizedInstanceConfig,
  normalizedLocalServerInstanceConfig,
} from '../../test/config';
import { setupJiraRecording } from '../../test/recording';
import { detectApiVersion } from './detectApiVersion';

describe(detectApiVersion, () => {
  let recording: Recording;

  afterEach(async () => {
    if (recording) await recording.stop();
  });

  test('version 3', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'detectVersion3',
      options: {
        recordFailedRequests: true,
      },
    });

    await expect(
      detectApiVersion({
        protocol: normalizedInstanceConfig.protocol,
        host: normalizedInstanceConfig.host,
        port: normalizedInstanceConfig.port,
      }),
    ).resolves.toEqual('3');
  });

  test('version 2', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'detectVersion2',
      options: {
        recordFailedRequests: true,
      },
    });

    await expect(
      detectApiVersion({
        protocol: normalizedLocalServerInstanceConfig.protocol,
        host: normalizedLocalServerInstanceConfig.host,
        port: normalizedLocalServerInstanceConfig.port,
      }),
    ).resolves.toEqual('2');
  });

  test('not a Jira host', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'detectVersionNotJiraHost',
      options: {
        recordFailedRequests: true,
      },
    });

    const protocol = 'http';
    const host = 'example.com';
    const port = '80';

    await expect(
      detectApiVersion({
        protocol: `${protocol}`,
        host: `${host}`,
        port: `${port}`,
      }),
    ).rejects.toThrow(
      `Invalid config on Jira host url: ${protocol}://${host}:${port}`,
    );
  });

  test('with custom path', async () => {
    recording = setupJiraRecording({
      directory: __dirname,
      name: 'withCustomPath',
      options: {
        recordFailedRequests: true,
      },
    });

    await expect(
      detectApiVersion({
        protocol: normalizedLocalServerInstanceConfig.protocol,
        host: normalizedLocalServerInstanceConfig.host,
        port: normalizedLocalServerInstanceConfig.port,
        base: 'test',
      }),
    ).resolves.toEqual('2');
  });
});
