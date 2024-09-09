import { ApolloClient } from '@apollo/client/core';
import type { ErrorResponse } from '../types';
import { useApollo } from './composables';
import type { Ref } from '#imports';
import type { ApolloClientKeys } from '#apollo';
declare const _default: any;
export default _default;
export interface ModuleRuntimeHooks {
    'apollo:auth': (params: {
        client: ApolloClientKeys;
        token: Ref<string | null>;
    }) => void;
    'apollo:error': (error: ErrorResponse) => void;
}
interface DollarApolloHelpers extends ReturnType<typeof useApollo> {
}
interface DollarApollo {
    clients: Record<ApolloClientKeys, ApolloClient<any>>;
    defaultClient: ApolloClient<any>;
}
declare module '#app' {
    interface RuntimeNuxtHooks extends ModuleRuntimeHooks {
    }
    interface NuxtApp {
        $apolloHelpers: DollarApolloHelpers;
        $apollo: DollarApollo;
    }
}
declare module 'vue' {
    interface ComponentCustomProperties {
        $apolloHelpers: DollarApolloHelpers;
        $apollo: DollarApollo;
    }
}
