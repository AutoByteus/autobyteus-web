import { defineNuxtConfig } from 'nuxt/config'
import { join } from 'path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/apollo', '@pinia/nuxt', '@nuxt/test-utils/module'],

  runtimeConfig: {
    public: {
      graphqlBaseUrl: process.env.NUXT_PUBLIC_GRAPHQL_BASE_URL || 'http://localhost:8000/graphql',
      restBaseUrl: process.env.NUXT_PUBLIC_REST_BASE_URL || 'http://localhost:8000/rest',
      wsBaseUrl: process.env.NUXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8000/graphql',
    }
  },

  apollo: {
    clients: {
      default: {
        httpEndpoint: '/graphql',
        wsEndpoint: '/graphql',
        websocketsOnly: false,
      },
    },
  },

  postcss: {
    plugins: {
      'postcss-import': {},
      'tailwindcss/nesting': {},
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  compatibilityDate: '2024-07-22',

  vite: {
    assetsInclude: ['**/*.jpeg', '**/*.jpg', '**/*.png', '**/*.svg'],
    plugins: [
      electron({
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            sourcemap: true,
            minify: process.env.NODE_ENV === 'production',
          },
        },
      }),
      renderer(),
    ],
    resolve: {
      alias: {
        '@electron': join(__dirname, 'electron'),
      },
    },
  },

  nitro: {
    routeRules: {
      '/graphql': { proxy: { to: process.env.NUXT_PUBLIC_GRAPHQL_BASE_URL } },
      '/rest/**': { proxy: { to: process.env.NUXT_PUBLIC_REST_BASE_URL + '/**' } },
    },
  },
})