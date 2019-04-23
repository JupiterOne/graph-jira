import { IntegrationInvocationConfig } from "@jupiterone/jupiter-managed-integration-sdk";

import executionHandler from "./executionHandler";
import invocationValidator from "./invocationValidator";

const config: IntegrationInvocationConfig = {
  executionHandler,
  invocationValidator,
};

export default config;
