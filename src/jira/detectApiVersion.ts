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
      const response = await fetch(
        `${apiOptions.protocol}://${apiOptions.host}:${apiOptions.port}${
          apiOptions.base ? `/${apiOptions.base}` : ''
        }/rest/api/${version}/serverInfo`,
        {
          follow: 0,
        },
      );
      if (response.headers.get('content-type')?.match(/application\/json/)) {
        const info = (await response.json()) as ServerInfo;
        if (VERSION_DETECTIONS[version](response.status, info)) {
          return version;
        }
      }
    } catch (err) {
      errors.push(err);
    }
  }

  let message = `Could not detect the Jira server version (/rest/api/{${KNOWN_JIRA_API_VERSIONS.join(
    ',',
  )}}/serverInfo):`;
  errors.forEach((e) => (message += `\n\t${e.message}`));
  throw new Error(message);
}
