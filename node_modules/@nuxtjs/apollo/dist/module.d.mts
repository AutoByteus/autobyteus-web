import * as _nuxt_schema from '@nuxt/schema';
import { N as NuxtApolloConfig, C as ClientConfig } from './shared/apollo.edd48338.mjs';
export { ErrorResponse } from '@apollo/client/link/error';
import 'graphql-ws';
import '@apollo/client';
import 'nuxt/app';

type ModuleOptions = NuxtApolloConfig;
declare const _default: _nuxt_schema.NuxtModule<ModuleOptions>;

declare const defineApolloClient: (config: ClientConfig) => ClientConfig;
interface ModuleRuntimeConfig {
    apollo: NuxtApolloConfig<any>;
}
interface ModulePublicRuntimeConfig {
    apollo: NuxtApolloConfig<any>;
}
declare module '@nuxt/schema' {
    interface NuxtConfig {
        ['apollo']?: Partial<ModuleOptions>;
    }
    interface NuxtOptions {
        ['apollo']?: ModuleOptions;
    }
    interface RuntimeConfig extends ModuleRuntimeConfig {
    }
    interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {
    }
}

export { ClientConfig, type ModuleOptions, type ModulePublicRuntimeConfig, type ModuleRuntimeConfig, _default as default, defineApolloClient };
