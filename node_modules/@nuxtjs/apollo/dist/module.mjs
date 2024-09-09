import { existsSync } from 'fs';
import jiti from 'jiti';
import { defu } from 'defu';
import { useLogger, defineNuxtModule, createResolver, addTemplate, addPlugin, addImports } from '@nuxt/kit';
import GraphQLPlugin from '@rollup/plugin-graphql';

const name = "@nuxtjs/apollo";
const version = "5.0.0-alpha.14";

const serializeConfig = (obj) => {
  if (typeof obj === "function") {
    return obj.toString();
  }
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return `[${obj.map(serializeConfig).join(", ")}]`;
    } else {
      return `{${Object.entries(obj).map(([key, value]) => `${serializeConfig(key)}: ${serializeConfig(value)}`).join(", ")}}`;
    }
  }
  return JSON.stringify(obj);
};

const logger = useLogger(name);
async function readConfigFile(path) {
  return await jiti(import.meta.url, { esmResolve: true, interopDefault: true, requireCache: false })(path);
}
const module = defineNuxtModule({
  meta: {
    name,
    version,
    configKey: "apollo",
    compatibility: {
      nuxt: "^3.0.0-rc.9"
    }
  },
  defaults: {
    autoImports: true,
    authType: "Bearer",
    authHeader: "Authorization",
    tokenStorage: "cookie",
    proxyCookies: true,
    cookieAttributes: {
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    },
    clientAwareness: false
  },
  async setup(options, nuxt) {
    if (!options.clients || !Object.keys(options.clients).length) {
      logger.warn("No apollo clients configured.");
      return;
    }
    const { resolve } = createResolver(import.meta.url);
    const rootResolver = createResolver(nuxt.options.rootDir);
    nuxt.options.build.transpile = nuxt.options.build.transpile || [];
    nuxt.options.build.transpile.push(
      resolve("runtime"),
      "tslib",
      "@wry/context",
      "@apollo/client",
      "@vue/apollo-composable",
      "ts-invariant/process"
    );
    const clients = {};
    const configPaths = {};
    async function prepareClients() {
      for (let [k, v] of Object.entries(options.clients || {})) {
        if (typeof v === "string") {
          const path = rootResolver.resolve(v);
          const resolvedConfig = existsSync(path) && await readConfigFile(path);
          if (!resolvedConfig) {
            logger.warn(`Unable to resolve Apollo config for client: ${k}`);
            continue;
          }
          v = resolvedConfig;
          if (!configPaths[k]) {
            configPaths[k] = path;
          }
        }
        v.authType = (v?.authType === void 0 ? options.authType : v?.authType) || null;
        v.authHeader = v?.authHeader || options.authHeader;
        v.tokenName = v?.tokenName || `apollo:${k}.token`;
        v.tokenStorage = v?.tokenStorage || options.tokenStorage;
        if (v.cookieAttributes) {
          v.cookieAttributes = defu(v?.cookieAttributes, options.cookieAttributes);
        }
        v.defaultOptions = v?.defaultOptions || options.defaultOptions;
        if (!v?.httpEndpoint && !v?.wsEndpoint) {
          logger.error(`Either \`httpEndpoint\` or \`wsEndpoint\` must be provided for client: \`${k}\``);
        }
        clients[k] = v;
      }
    }
    addTemplate({
      filename: "apollo.d.ts",
      getContents: () => [
        'import type { ClientConfig } from "@nuxtjs/apollo"',
        "declare module '#apollo' {",
        `  export type ApolloClientKeys = '${Object.keys(clients).join("' | '")}'`,
        "  export const NuxtApollo: {",
        "    clients: Record<ApolloClientKeys, ClientConfig>",
        "    clientAwareness: boolean",
        "    proxyCookies: boolean",
        "    cookieAttributes: ClientConfig['cookieAttributes']",
        "  }",
        "}"
      ].join("\n")
    });
    addTemplate({
      filename: "apollo.mjs",
      getContents: () => [
        "export const NuxtApollo = {",
        ` proxyCookies: ${options.proxyCookies},`,
        ` clientAwareness: ${options.clientAwareness},`,
        ` cookieAttributes: ${serializeConfig(options.cookieAttributes)},`,
        ` clients: ${serializeConfig(clients)}`,
        "}"
      ].join("\n")
    });
    nuxt.options.alias["#apollo"] = resolve(nuxt.options.buildDir, "apollo");
    addPlugin(resolve("runtime/plugin"));
    addImports([
      { name: "gql", from: "graphql-tag" },
      ...[
        "useApollo",
        "useAsyncQuery",
        "useLazyAsyncQuery"
      ].map((n) => ({ name: n, from: resolve("runtime/composables") })),
      ...!options?.autoImports ? [] : [
        "useQuery",
        "useLazyQuery",
        "useMutation",
        "useSubscription",
        "useApolloClient",
        "useQueryLoading",
        "useMutationLoading",
        "useSubscriptionLoading",
        "useGlobalQueryLoading",
        "useGlobalMutationLoading",
        "useGlobalSubscriptionLoading"
      ].map((n) => ({ name: n, from: "@vue/apollo-composable" }))
    ]);
    nuxt.hook("vite:extendConfig", (config) => {
      config.optimizeDeps = config.optimizeDeps || {};
      config.optimizeDeps.exclude = config.optimizeDeps.exclude || [];
      config.optimizeDeps.exclude.push("@vue/apollo-composable");
      config.plugins = config.plugins || [];
      config.plugins.push(GraphQLPlugin());
      if (!nuxt.options.dev) {
        config.define = { ...config.define, __DEV__: false };
      }
    });
    nuxt.hook("webpack:config", (configs) => {
      for (const config of configs) {
        const hasGqlLoader = config.module.rules.some((rule) => rule?.use === "graphql-tag/loader");
        if (hasGqlLoader) {
          return;
        }
        config.module.rules.push({
          test: /\.(graphql|gql)$/,
          use: "graphql-tag/loader",
          exclude: /(node_modules)/
        });
      }
    });
    nuxt.hook("builder:watch", async (_event, path) => {
      if (!Object.values(configPaths).some((p) => p.includes(path))) {
        return;
      }
      logger.log("[@nuxtjs/apollo] Reloading Apollo configuration");
      await prepareClients();
      await nuxt.callHook("builder:generateApp");
    });
    await prepareClients();
  }
});
const defineApolloClient = (config) => config;

export { module as default, defineApolloClient };
