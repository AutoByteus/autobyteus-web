import { C as ClientConfig } from './shared/apollo.edd48338.js';
import 'graphql-ws';
import '@apollo/client';
import 'nuxt/app';

declare const defineApolloClient: (config: ClientConfig) => ClientConfig;

export { ClientConfig, defineApolloClient };
