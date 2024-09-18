import { defineNuxtConfig } from 'nuxt/config'
import { join } from 'path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/apollo', '@pinia/nuxt', 'nuxt-electron'],

  apollo: {
    clients: {
      default: {
        httpEndpoint: 'http://localhost:8000/graphql',
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
  electron: {
    build: [
      {
        // Main-Process entry file of the Electron App.
        entry: 'electron/main.ts',
      },
    ],
  },
  ssr: false
})