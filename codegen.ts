import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.NUXT_PUBLIC_GRAPHQL_BASE_URL,
  documents: "graphql/**/*.ts",
  generates: {
    "./generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-vue-apollo"
      ]
    }
  }
};

export default config;