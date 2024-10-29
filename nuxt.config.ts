import { defineNuxtConfig } from 'nuxt/config'
import { join } from 'path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/apollo', '@pinia/nuxt', '@nuxt/test-utils/module'],

  // For static generation (when using generate)
  ssr: false,
  
  nitro: {
    preset: 'static',
    // Development proxy settings
    devProxy: process.env.NODE_ENV === 'development' ? {
      '/graphql': {
        target: process.env.NUXT_PUBLIC_GRAPHQL_BASE_URL || 'http://localhost:8000/graphql',
        changeOrigin: true,
      },
      '/rest': {
        target: process.env.NUXT_PUBLIC_REST_BASE_URL || 'http://localhost:8000/rest',
        changeOrigin: true,
      }
    } : {}
  },

  runtimeConfig: {
    public: {
      graphqlBaseUrl: process.env.NUXT_PUBLIC_GRAPHQL_BASE_URL || 'http://localhost:8000/graphql',
      restBaseUrl: process.env.NUXT_PUBLIC_REST_BASE_URL || 'http://localhost:8000/rest',
      wsBaseUrl: process.env.NUXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8000/graphql',
      // Add this to detect environment
      isElectron: process.env.NODE_ENV === 'electron'
    }
  },

  apollo: {
    clients: {
      default: {
        // Use relative URL in development, full URL in production
        httpEndpoint: process.env.NODE_ENV === 'development' 
          ? '/graphql'
          : (process.env.NUXT_PUBLIC_GRAPHQL_BASE_URL || 'http://localhost:8000/graphql'),
        
        // Always use full URL for WebSocket
        wsEndpoint: process.env.NUXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8000/graphql',
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
      renderer(), // Add back the renderer plugin
    ],
    resolve: {
      alias: {
        '@electron': join(__dirname, 'electron'),
        '@': __dirname, // Keep root alias if needed
      },
    },
    // Add environment variables to Vite
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }
  },

  // Remove routeRules since we're using devProxy for development
  // and full URLs for production
})