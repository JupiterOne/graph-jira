import {
  IntegrationInstance,
  lastSuccessfulSynchronizationTime,
} from "@jupiterone/jupiter-managed-integration-sdk";

export default async function getLastSyncTime(
  instance: IntegrationInstance,
): Promise<number | null> {
  return lastSuccessfulSynchronizationTime(instance.accountId, instance.id);
}
