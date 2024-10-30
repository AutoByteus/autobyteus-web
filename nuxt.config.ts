import { defineNuxtConfig } from 'nuxt/config'
const isElectronBuild = process.env.BUILD_TARGET === 'electron'
console.log(`isElectronBuild: ${isElectronBuild}`)

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/apollo',
    '@pinia/nuxt',
    '@nuxt/test-utils/module',
    './modules/electron'
  ],
  electron: {
    build: [
      {
        // Main process entry
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist/electron',
            rollupOptions: {
              external: ['electron']
            }
          },
        },
      },
      {
        // Preload script
        entry: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist/electron',
            rollupOptions: {
              external: ['electron']
            }
          },
        },
      }
    ],
    renderer: {
      nodeIntegration: false,
    },
  },
  ssr: false,
  app: {
    baseURL: isElectronBuild ? './' : '/',
    // Conditionally set buildAssetsDir based on build target
    buildAssetsDir: isElectronBuild ? '/' : '_nuxt/',
    // Ensure trailing slash
  },
  nitro: {
    preset: 'static',
    output: {
      dir: 'dist',
      publicDir: 'dist/renderer'
    },
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
  vite: {
    base: isElectronBuild ? './' : '/',
    build: {
      // Ensure assets are output to buildAssetsDir
      assetsDir: '_nuxt',
      rollupOptions: {
        output: {
          // Remove '_nuxt/' prefix to prevent double nesting
          assetFileNames: '[name].[hash][extname]',
          chunkFileNames: '[name].[hash].js',
          entryFileNames: '[name].[hash].js',
        }
      }
    },
    assetsInclude: ['**/*.jpeg', '**/*.jpg', '**/*.png', '**/*.svg'],
    worker: {
      format: 'es',
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }
  },
  // Rest of your configuration remains the same
  runtimeConfig: {
    public: {
      graphqlBaseUrl: process.env.NUXT_PUBLIC_GRAPHQL_BASE_URL || 'http://localhost:8001/graphql',
      restBaseUrl: process.env.NUXT_PUBLIC_REST_BASE_URL || 'http://localhost:8001/rest',
      wsBaseUrl: process.env.NUXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8001/graphql'
    }
  },
  apollo: {
    clients: {
      default: {
        httpEndpoint: process.env.NODE_ENV === 'development' 
          ? '/graphql'
          : (process.env.NUXT_PUBLIC_GRAPHQL_BASE_URL || 'http://localhost:8000/graphql'),
        wsEndpoint: process.env.NUXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8001/graphql',
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
  build: {
    transpile: ['@xenova/transformers'],
  }
})