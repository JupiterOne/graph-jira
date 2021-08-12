import {
    setupRecording,
    Recording,
    SetupRecordingInput,
    mutations,
  } from '@jupiterone/integration-sdk-testing';
import { DEFAULT_JIRA_HOST, integrationConfig } from './config';
  
  export { Recording };
  
  export function setupJiraRecording(
    input: Omit<SetupRecordingInput, 'mutateEntry'>,
  ): Recording {
    return setupRecording({
      ...input,
      redactedRequestHeaders: ['Authorization'],
      redactedResponseHeaders: ['set-cookie'],
      mutateEntry: (entry) => {
        redact(entry);
      },
    });
  }
  
  function redact(entry: any): void {
    if (!entry.response.content.text) {
      return;
    }
  
    //let's unzip the entry so we can modify it
    mutations.unzipGzippedRecordingEntry(entry);
  
    entry.request.headers.forEach((header: any) => {
      if (header.name === 'authorization') {
        header.value = 'Bearer [REDACTED]';
      }
      if (header.name === 'host') {
        header.value = DEFAULT_JIRA_HOST;
      }
    });
  
    if (/access_tokens/.exec(entry.request.url)) {
      const responseContent = JSON.parse(entry.response.content.text);
      responseContent.token = '[REDACTED]';
      entry.response.content.text = JSON.stringify(responseContent);
    }

    entry.request.url = entry.request.url.replace(integrationConfig.jiraHost, DEFAULT_JIRA_HOST)
  }