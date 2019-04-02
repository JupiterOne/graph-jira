/**
 * A request delivered to the integration service requesting that an action is
 * dispatched to an integration.
 *
 * Any client that needs to invoke an integration action should deliver an
 * `IntegrationActionTrigger` to the integration service. Unless a
 * `targetIntegrationInstanceId` is specified, the service will discover the
 * integration instance configured in the J1 account that is capable of handling
 * the action.
 *
 * The integration service will then deliver an `IntegrationActionTriggerEvent`
 * to the integration. This is used to create an `IntegrationInvocationEvent`,
 * which is then provided to the `IntegrationExecutionHandler` as the
 * `IntegrationInvocationContext.event`.
 */
export interface IntegrationActionTrigger {
  /**
   * The JupiterOne account identifier. The integration instance belongs to this
   * account.
   */
  accountId: string;

  /**
   * The action to deliver to the integration.
   */
  action: IntegrationAction;

  /**
   * The integration instance pre-selected to process the action.
   *
   * It will be necessary at times to allow the mechanism which creates the
   * action to specify the integration instance that should handle the action.
   * When this is not provided, the most suitable integration instance will be
   * determined.
   *
   * The instance features will be verified to support the action.
   */
  targetIntegrationInstanceId?: string;
}

/**
 * An event delivered to an integration when it is invoked.
 *
 * TODO: Rename the type in `@lifeomic/jupiter-types'
 */
export interface IntegrationActionTriggerEvent {
  /**
   * The JupiterOne account identifier. The integration instance belongs to this
   * account.
   */
  accountId: string;

  /**
   * The ID of the integration instance to run against.
   */
  integrationInstanceId: string;

  /**
   * The action the integration is to take.
   */
  action: IntegrationAction;
}

/**
 * An action delivered to an integration instance.
 *
 * Integrations are expected to process actions in a provider appropriate way,
 * depending on the `name` of the action and any additional, action-specific
 * properties.
 */
export interface IntegrationAction {
  /**
   * The integration action name.
   *
   * The action name used as part of the process to determine or validate the
   * integration instance that will handle the action. The integration examines
   * the `name` to determine its course of action.
   */
  name: IntegrationActionName;
}

/**
 * An action directing an integration to ingest data from the provider.
 *
 * It is possible to direct the integration to ingest a specific class of data,
 * or to ingest a specific entity from the provider. It is not necessarily
 * expected that objects related to the entity, nor relationships to them, are
 * also ingested.
 */
export interface IntegrationIngestAction extends IntegrationAction {
  name: IntegrationActionName.INGEST;

  /**
   * The class of entities to ingest. All classes of entities should be ingested
   * when `class` is not provided.
   */
  class?: string;

  /**
   * The identifier of a specific entity to ingest. The `class` of entity must
   * be considered to scope the `externalId`.
   */
  externalId?: string;
}

/**
 * An action directing an integration to start a scan in the provider.
 */
export interface IntegrationScanAction extends IntegrationAction {
  name: IntegrationActionName.SCAN;

  /**
   * The type of scan requested.
   */
  scanType: IntegrationScanType;

  /**
   * The J1 identifier of the entity to scan. The integration is responsible for
   * obtaining the entity and determining any necessary information for starting
   * the scan.
   */
  selectedEntityId: string;
}

/**
 * An action directing an integration to create an entity in the provider. It is
 * expected that the created provider entity will also be ingested into
 * JupiterOne.
 */
export interface IntegrationCreateEntityAction extends IntegrationAction {
  name: IntegrationActionName.CREATE_ENTITY;
  class: string;
  properties: object;
}

/**
 * Names the actions supported by one or more integrations.
 */
export enum IntegrationActionName {
  INGEST = "INGEST",
  SCAN = "SCAN",
  CREATE_ENTITY = "CREATE_ENTITY",
}

/**
 * Integrations supporting the `'SCAN'` action will receive the type of scan to
 * perform.
 */
export enum IntegrationScanType {
  STATIC = "STATIC",
  DYNAMIC = "DYNAMIC",
}
