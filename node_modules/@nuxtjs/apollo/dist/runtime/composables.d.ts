import type { ApolloClient, OperationVariables, QueryOptions, DefaultContext } from '@apollo/client';
import type { AsyncData, AsyncDataOptions, NuxtError } from 'nuxt/app';
import type { ApolloClientKeys } from '#apollo';
type PickFrom<T, K extends Array<string>> = T extends Array<any> ? T : T extends Record<string, any> ? keyof T extends K[number] ? T : K[number] extends never ? T : Pick<T, K[number]> : T;
type KeysOf<T> = Array<T extends T ? keyof T extends string ? keyof T : never : never>;
type TQuery<T> = QueryOptions<OperationVariables, T>['query'];
type TVariables<T> = QueryOptions<OperationVariables, T>['variables'] | null;
type TAsyncQuery<T> = {
    /**
     * A unique key to ensure the query can be properly de-duplicated across requests. Defaults to a hash of the query and variables.
     */
    key?: string;
    /**
     * A GraphQL query string parsed into an AST with the gql template literal.
     */
    query: TQuery<T>;
    /**
     * An object containing all of the GraphQL variables your query requires to execute.
     *
     * Each key in the object corresponds to a variable name, and that key's value corresponds to the variable value.
     */
    variables?: TVariables<T>;
    /**
     * The name of the Apollo Client to use. Defaults to `default`.
     */
    clientId?: ApolloClientKeys;
    /**
     * If you're using Apollo Link, this object is the initial value of the context object that's passed along your link chain.
     */
    context?: DefaultContext;
    /**
     * If `true`, this overrides the default fetchPolicy for the Apollo Client to `cache-first`.
     * */
    cache?: boolean;
};
/**
 * `useAsyncQuery` resolves the GraphQL query asynchronously in a SSR-friendly composable.
 *
 * @param opts An object containing the query, variables, clientId, context, and cache options.
 * @param options Customize the underlying `useAsyncData` composable.
 */
export declare function useAsyncQuery<T, DataT = T, PickKeys extends KeysOf<DataT> = KeysOf<DataT>, DefaultT = null, NuxtErrorDataT = unknown>(opts: TAsyncQuery<T>, options?: AsyncDataOptions<T, DataT, PickKeys, DefaultT>): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | null>;
/**
 * `useAsyncQuery` resolves the GraphQL query asynchronously in a SSR-friendly composable.
 *
 * @param query A GraphQL query string parsed into an AST with the gql template literal.
 * @param variables An object containing all of the GraphQL variables your query requires to execute.
 * @param clientId The name of the Apollo Client to use. Defaults to `default`.
 * @param context The context object that's passed along your link chain.
 * @param options Customize the underlying `useAsyncData` composable.
 */
export declare function useAsyncQuery<T, DataT = T, PickKeys extends KeysOf<DataT> = KeysOf<DataT>, DefaultT = null, NuxtErrorDataT = unknown>(query: TQuery<T>, variables?: TVariables<T>, clientId?: ApolloClientKeys, context?: DefaultContext, options?: AsyncDataOptions<T, DataT, PickKeys, DefaultT>): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | null>;
/**
 * `useLazyAsyncQuery` resolves the GraphQL query after loading the route, instead of blocking client-side navigation.
 *
 * @param opts An object containing the query, variables, clientId, context, and cache options.
 * @param options Customize the underlying `useAsyncData` composable.
 */
export declare function useLazyAsyncQuery<T, DataT = T, PickKeys extends KeysOf<DataT> = KeysOf<DataT>, DefaultT = null, NuxtErrorDataT = unknown>(opts: TAsyncQuery<T>, options?: AsyncDataOptions<T, DataT, PickKeys, DefaultT>): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | null>;
/**
 * `useLazyAsyncQuery` resolves the GraphQL query after loading the route, instead of blocking client-side navigation.
 *
 * @param query A GraphQL query string parsed into an AST with the gql template literal.
 * @param variables An object containing all of the GraphQL variables your query requires to execute.
 * @param clientId The name of the Apollo Client to use. Defaults to `default`.
 * @param context The context object that's passed along your link chain.
 * @param options Customize the underlying `useAsyncData` composable.
 */
export declare function useLazyAsyncQuery<T, DataT = T, PickKeys extends KeysOf<DataT> = KeysOf<DataT>, DefaultT = null, NuxtErrorDataT = unknown>(query: TQuery<T>, variables?: TVariables<T>, clientId?: string, context?: DefaultContext, options?: AsyncDataOptions<T, DataT, PickKeys, DefaultT>): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | null>;
export declare function useApollo(): {
    /**
     * Access the configured apollo clients.
     */
    clients: Record<ApolloClientKeys, ApolloClient<any>> | undefined;
    /**
     * Retrieve the auth token for the specified client. Adheres to the `apollo:auth` hook.
     *
     * @param {string} client The client who's token to retrieve. Defaults to `default`.
     */
    getToken: (client?: ApolloClientKeys) => Promise<string | null | undefined>;
    /**
     * Apply auth token to the specified Apollo client, and optionally reset it's cache.
     *
     * @param {string} token The token to be applied.
     * @param {string} client - Name of the Apollo client. Defaults to `default`.
     * @param {boolean} skipResetStore - If `false`, Resets your entire store by clearing out your cache and then re-executing all of your active queries.
     * */
    onLogin: (token?: string, client?: ApolloClientKeys, skipResetStore?: boolean) => Promise<void>;
    /**
     * Remove the auth token from the Apollo client, and optionally reset it's cache.
     *
     * @param {string} client - Name of the Apollo client. Defaults to `default`.
     * @param {boolean} skipResetStore - If `false`, Resets your entire store by clearing out your cache and then re-executing all of your active queries.
     * */
    onLogout: (client?: ApolloClientKeys, skipResetStore?: boolean) => Promise<void>;
};
export {};
