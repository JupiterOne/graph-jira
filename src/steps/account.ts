import {
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from '../config';
import { createAccountEntity } from '../converters';
import { createApiClient } from '../utils';

export const DATA_ACCOUNT_ENTITY = 'DATA_ACCOUNT_ENTITY';

export async function fetchAccountDetails({
  jobState,
  instance,
  logger,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const config = instance.config;
  const apiClient = createApiClient(logger, config);
  const accountEntity = await jobState.addEntity(
    createAccountEntity(await apiClient.fetchServerInfo()),
  );

  await jobState.setData(DATA_ACCOUNT_ENTITY, accountEntity);
}

export const accountSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-account',
    name: 'Fetch Account Details',
    entities: [
      {
        resourceName: 'Account',
        _type: 'jira_account',
        _class: 'Account',
      },
    ],
    relationships: [],
    dependsOn: [],
    executionHandler: fetchAccountDetails,
  },
];
