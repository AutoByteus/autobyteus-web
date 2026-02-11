import { createExternalMessagingGatewayClient } from '~/services/externalMessagingGatewayClient';

export interface GatewayClientFactoryInput {
  baseUrl: string;
  adminToken?: string;
}

export function createGatewayClient(input: GatewayClientFactoryInput) {
  return createExternalMessagingGatewayClient({
    baseUrl: input.baseUrl,
    adminToken: input.adminToken,
  });
}
