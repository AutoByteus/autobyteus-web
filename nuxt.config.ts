import { defineNuxtConfig } from 'nuxt/config'
import { join } from 'path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/apollo', '@pinia/nuxt', '@nuxt/test-utils/module'],

  apollo: {
    clients: {
      default: {
        httpEndpoint: 'http://localhost:8000/graphql',
        wsEndpoint: 'ws://localhost:8000/graphql', // Add WebSocket endpoint
        websocketsOnly: false, // Enable both HTTP and WebSocket transports
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
        '@electron': join(__dirname, 'electron'), // Ensure the alias matches tsconfig paths
      },
    },
  },
})