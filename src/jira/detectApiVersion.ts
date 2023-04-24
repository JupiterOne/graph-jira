import { IntegrationValidationError } from '@jupiterone/integration-sdk-core';
import { JiraApiOptions } from 'jira-client';
import fetch from 'node-fetch';

import { KNOWN_JIRA_API_VERSIONS } from './';
import { JiraApiVersion, ServerInfo } from './types';

const VERSION_DETECTIONS = {
  '2': (status: number, info?: ServerInfo) => {
    return (
      (status === 200 && info?.deploymentType === 'Server') || status === 302
    );
  },
  '3': (status: number, info?: ServerInfo) => {
    return status === 200 && info?.deploymentType === 'Cloud';
  },
};

/**
 * Detects the API version of the Jira server by fetching the `ServerInfo`. Note
 * that this does not require authentication.
 */
export async function detectApiVersion(
  apiOptions: Required<Pick<JiraApiOptions, 'protocol' | 'host' | 'port'>> & {
    base?: string;
  },
): Promise<JiraApiVersion> {
  const errors: Error[] = [];

  for (const version of KNOWN_JIRA_API_VERSIONS) {
    try {
      const base = `${apiOptions.protocol}://${apiOptions.host}:${apiOptions.port}`;
      const url = apiOptions.base
        ? `${base}/${apiOptions.base}/rest/api/${version}/serverInfo`
        : `${base}/rest/api/${version}/serverInfo`;

      const response = await fetch(url, {
        follow: 0,
      });
      if (response.headers.get('content-type')?.match(/application\/json/)) {
        const info = (await response.json()) as ServerInfo;
        if (VERSION_DETECTIONS[version](response.status, info)) {
          return version;
        }
      }
    } catch (err) {
      // Consolidate errors to provide a more helpful message
      errors.push(err);
    }
  }

  let message = `Invalid config on Jira host url: ${apiOptions.protocol}://${apiOptions.host}:${apiOptions.port}`;
  errors.forEach((e) => (message += `\n\t${e.message}`));
  throw new IntegrationValidationError(message);
}
