import { JiraHostConfig } from './types';

/**
 * Used to validate and extract values from the `jiraHost` configuration value.
 *
 * Test, advance, and see capture groups with examples at
 * https://regextester.github.io/XigoaHR0cHM_KSg6Ly8pKT8oKChbYS16QS1aMC05XXxbYS16QS1aMC05XVthLXpBLVowLTlcLV0qW2EtekEtWjAtOV0pXC4pKihbQS1aYS16MC05XXxbQS1aYS16MC05XVtBLVphLXowLTlcLV0qW0EtWmEtejAtOV0pKSg6KFxkezEsNH0pKT8oXC8oW0EtWmEtejAtOV0rKSk_JA/dGVzdGluZy5jb206ODA4MC8xMjMKdGVzdGluZy5jb20KbG9jYWxob3N0CmxvY2FsaG9zdDo4MDgwCmZ0cDovL2JvYmJseQpodHRwOi8vam9uZXMKaHR0cHM6Ly9ib2JieQpodHRwOi9ib2Ji/32770
 * That URL needs to be updated here whent he regular expression is changed.
 */
const JIRA_HOST_REGEX =
  /^((https?)(:\/\/))?((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9]))(:(\d{1,4}))?(\/([A-Za-z0-9]+))?$/;

/**
 * Validates a Jira host string. The protocol, port, and base path are optional.
 * Valid values include:
 *
 * - `"localhost"`
 * - `"localhost:8080"`
 * - `"localhost/urlBase"`
 * - `"http://example.com"`
 * - `"subdomain.example.com/urlBase"`
 * - `"https://subdomain.example.com:443/urlBase"`
 */
export function isValidJiraHost(jiraHost: string | undefined): boolean {
  return !!jiraHost && JIRA_HOST_REGEX.test(jiraHost);
}

/**
 * Extracts component parts of a valid Jira host string.
 *
 * @throws Error when the host string is not valid or cannot be parsed
 */
export function buildJiraHostConfig(jiraHost: string): JiraHostConfig {
  const match = jiraHost.match(JIRA_HOST_REGEX);
  if (match) {
    return {
      protocol: match[2] || 'https',
      host: match[4],
      port: match[9] || '443',
      base: match[11],
    };
  } else {
    throw new Error(
      `Could not extract options from ${JSON.stringify(jiraHost)}`,
    );
  }
}
