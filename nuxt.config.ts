import { defineNuxtConfig } from 'nuxt/config'
import { applyElectronConfig } from './nuxt.electron.config'

// Fixed server port for internal server
const INTERNAL_SERVER_PORT = 29695

// Configure default server URLs for non-Electron builds
const defaultServerUrls = {
  graphqlBaseUrl: process.env.NUXT_PUBLIC_GRAPHQL_BASE_URL || 'http://localhost:8000/graphql',
  restBaseUrl: process.env.NUXT_PUBLIC_REST_BASE_URL || 'http://localhost:8000/rest',
  wsBaseUrl: process.env.NUXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8000/graphql',
  transcriptionWsEndpoint: process.env.NUXT_PUBLIC_TRANSCRIPTION_WS_ENDPOINT || 'ws://localhost:8000/ws/transcribe'
}

// For Electron builds, always use the internal server port
const electronServerUrls = {
  graphqlBaseUrl: `http://localhost:${INTERNAL_SERVER_PORT}/graphql`,
  restBaseUrl: `http://localhost:${INTERNAL_SERVER_PORT}/rest`,
  wsBaseUrl: `http://localhost:${INTERNAL_SERVER_PORT}/graphql`,
  transcriptionWsEndpoint: `http://localhost:${INTERNAL_SERVER_PORT}/transcribe`
}

// Select server URLs based on build target
const serverUrls = process.env.BUILD_TARGET === 'electron' ? electronServerUrls : defaultServerUrls

console.log('Nuxt config: Build target:', process.env.BUILD_TARGET || 'browser')
console.log('Nuxt config: GraphQL URL:', serverUrls.graphqlBaseUrl)
console.log('Nuxt config: REST URL:', serverUrls.restBaseUrl)

const baseConfig = {
  ssr: false,

  css: [
    '@fortawesome/fontawesome-svg-core/styles.css'
  ],

  plugins: [
    '~/plugins/fontawesome.ts'
  ],
  
  modules: [
    '@nuxtjs/apollo',
    '@pinia/nuxt',
    '@nuxt/test-utils/module'
  ],

  // Add global middleware
  routeRules: {
    '/workspace/**': { middleware: ['workspace'] },
    '/': { middleware: ['workspace'] }
  },

  nitro: {
    preset: 'static',
    output: {
      dir: 'dist',
      publicDir: 'dist/public'
    },
    devProxy: process.env.NODE_ENV === 'development' ? {
      '/graphql': {
        target: serverUrls.graphqlBaseUrl,
        changeOrigin: true,
      },
      '/rest': {
        target: serverUrls.restBaseUrl,
        changeOrigin: true,
      }
    } : {}
  },

  vite: {
    assetsInclude: ['**/*.jpeg', '**/*.jpg', '**/*.png', '**/*.svg'],
    worker: {
      format: 'es',
      plugins: [],
      rollupOptions: {
        output: {
          format: 'es',
          entryFileNames: 'workers/[name].js'
        }
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    },
    build: {
      target: 'es2022', // Added to support top-level await
    },
  },

  runtimeConfig: {
    public: {
      // Use server URLs based on the build target
      graphqlBaseUrl: serverUrls.graphqlBaseUrl,
      restBaseUrl: serverUrls.restBaseUrl,
      wsBaseUrl: serverUrls.wsBaseUrl,
      googleSpeechApiKey: process.env.GOOGLE_SPEECH_API_KEY || '',
      
      // Removed VNC configuration from runtimeConfig as it is now handled via server settings
      
      audio: {
        targetSampleRate: 16000,
        chunkDuration: 5,
        overlapDuration: 0.2,
        channels: 1,
        transcriptionWsEndpoint: serverUrls.transcriptionWsEndpoint,
        constraints: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }
    }
  },

  apollo: {
    clients: {
      default: {
        httpEndpoint: process.env.NODE_ENV === 'development' 
          ? '/graphql'
          : serverUrls.graphqlBaseUrl,
        wsEndpoint: serverUrls.wsBaseUrl,
        websocketsOnly: false,
        // Enable in-memory cache and set default fetch policy
        inMemoryCacheOptions: {},
        defaultOptions: {
          watchQuery: {
            fetchPolicy: 'cache-first',
          },
          query: {
            fetchPolicy: 'cache-first',
          },
        },
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
    // Add noVNC to transpile so that Babel processes it
    transpile: [
      '@xenova/transformers',
    ],
  }
}

export default defineNuxtConfig(applyElectronConfig(baseConfig))
