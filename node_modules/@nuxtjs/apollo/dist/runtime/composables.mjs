import { hash } from "ohash";
import { print } from "graphql";
import { ref, unref, isRef, reactive, useCookie, useNuxtApp, useAsyncData } from "#imports";
import { NuxtApollo } from "#apollo";
export function useAsyncQuery(...args) {
  const { key, fn, options } = prep(...args);
  return useAsyncData(key, fn, options);
}
export function useLazyAsyncQuery(...args) {
  const { key, fn, options } = prep(...args);
  return useAsyncData(key, fn, { ...options, lazy: true });
}
const prep = (...args) => {
  const { clients } = useApollo();
  let query;
  let variables;
  let cache;
  let clientId;
  let context;
  let options = {};
  if (typeof args?.[0] === "object" && "query" in args[0]) {
    query = args?.[0]?.query;
    variables = args?.[0]?.variables;
    cache = args?.[0]?.cache;
    context = args?.[0]?.context;
    clientId = args?.[0]?.clientId;
    if (typeof args?.[1] === "object") {
      options = args?.[1];
    }
  } else {
    query = args?.[0];
    variables = args?.[1];
    clientId = args?.[2];
    context = args?.[3];
    if (typeof args?.[4] === "object") {
      options = args?.[4];
    }
  }
  if (!query) {
    throw new Error("@nuxtjs/apollo: no query provided");
  }
  if (!clientId || !clients?.[clientId]) {
    clientId = clients?.default ? "default" : Object.keys(clients)?.[0];
    if (!clientId) {
      throw new Error("@nuxtjs/apollo: no client found");
    }
  }
  if (variables) {
    variables = isRef(variables) ? variables : reactive(variables);
    options.watch = options.watch || [];
    options.watch.push(variables);
  }
  const key = args?.[0]?.key || hash({ query: print(query), variables: unref(variables), clientId });
  const fn = () => clients[clientId]?.query({
    query,
    variables: unref(variables) || void 0,
    ...cache && { fetchPolicy: "cache-first" },
    context
  }).then((r) => r.data);
  return { key, query, clientId, variables, fn, options };
};
export function useApollo() {
  const nuxtApp = useNuxtApp();
  const getToken = async (client) => {
    client = client || "default";
    const conf = NuxtApollo?.clients?.[client];
    if (!conf) {
      return;
    }
    const token = ref(null);
    await nuxtApp.callHook("apollo:auth", { token, client });
    if (token.value) {
      return token.value;
    }
    const tokenName = conf.tokenName;
    return conf?.tokenStorage === "cookie" ? nuxtApp.runWithContext(() => useCookie(tokenName).value) : process.client && localStorage.getItem(tokenName) || null;
  };
  const updateAuth = async ({ token, client, mode, skipResetStore }) => {
    client = client || "default";
    const conf = NuxtApollo?.clients?.[client];
    if (!conf) {
      return;
    }
    const tokenName = client && conf.tokenName;
    if (conf?.tokenStorage === "cookie") {
      const cookieOpts = client && conf?.cookieAttributes || NuxtApollo?.cookieAttributes;
      const cookie = useCookie(tokenName, cookieOpts);
      if (!cookie.value && mode === "logout") {
        return;
      }
      cookie.value = mode === "login" && token || null;
    } else if (process.client && conf?.tokenStorage === "localStorage") {
      if (mode === "login" && token) {
        localStorage.setItem(tokenName, token);
      } else if (mode === "logout") {
        localStorage.removeItem(tokenName);
      }
    }
    if (nuxtApp?._apolloWsClients?.[client]) {
      nuxtApp._apolloWsClients[client].restart();
    }
    if (skipResetStore) {
      return;
    }
    await nuxtApp?._apolloClients?.[client].resetStore().catch((e) => console.log("%cError on cache reset", "color: orange;", e.message));
  };
  return {
    getToken,
    clients: nuxtApp?._apolloClients,
    onLogin: (token, client, skipResetStore) => updateAuth({ token, client, skipResetStore, mode: "login" }),
    onLogout: (client, skipResetStore) => updateAuth({ client, skipResetStore, mode: "logout" })
  };
}
