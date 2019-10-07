import { IntegrationExecutionContext } from "@jupiterone/jupiter-managed-integration-sdk";

export default async function getLastSyncTime(
  context: IntegrationExecutionContext,
): Promise<number | null> {
  return context.clients
    .getClients()
    .integrationService.lastSuccessfulSynchronizationTime();
}
