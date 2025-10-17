import { defineNuxtConfig } from 'nuxt/config'
import { applyElectronConfig } from './nuxt.electron.config'

// Fixed server port for internal server
const INTERNAL_SERVER_PORT = 29695
const isDevelopment = process.env.NODE_ENV === 'development'
const isElectronBuild = process.env.BUILD_TARGET === 'electron'

// --- Server URL Configuration ---

// Define backend URLs with clear precedence for different environments.
// 1. Environment variables are for the Docker dev environment or local overrides.
// 2. 'localhost:8000' is the default for standard local development.
const backendProxyUrl = process.env.NUXT_DEV_PROXY_URL || 'http://localhost:8000'

let serverUrls = {
  graphqlBaseUrl: '',
  restBaseUrl: '',
  wsBaseUrl: '',
  transcriptionWsEndpoint: ''
};

if (isElectronBuild) {
  serverUrls = {
    graphqlBaseUrl: `http://localhost:${INTERNAL_SERVER_PORT}/graphql`,
    restBaseUrl: `http://localhost:${INTERNAL_SERVER_PORT}/rest`,
    wsBaseUrl: `ws://localhost:${INTERNAL_SERVER_PORT}/graphql`,
    transcriptionWsEndpoint: `ws://localhost:${INTERNAL_SERVER_PORT}/transcribe`
  };
} else if (isDevelopment) {
  serverUrls = {
    graphqlBaseUrl: '/graphql',
    restBaseUrl: '/rest',
    wsBaseUrl: process.env.BACKEND_WS_BASE_URL || 'ws://localhost:8000/graphql',
    transcriptionWsEndpoint: process.env.BACKEND_TRANSCRIPTION_WS_ENDPOINT || 'ws://localhost:8000/ws/transcribe'
  };
} else {
  // Read from our custom-named environment variables to prevent automatic overrides.
  serverUrls = {
    graphqlBaseUrl: process.env.BACKEND_GRAPHQL_BASE_URL || 'http://localhost:8000/graphql',
    restBaseUrl: process.env.BACKEND_REST_BASE_URL || 'http://localhost:8000/rest',
    wsBaseUrl: process.env.BACKEND_WS_BASE_URL || 'ws://localhost:8000/graphql',
    transcriptionWsEndpoint: process.env.BACKEND_TRANSCRIPTION_WS_ENDPOINT || 'ws://localhost:8000/ws/transcribe'
  };
}

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
    devProxy: isDevelopment ? {
      '/graphql': {
        target: `${backendProxyUrl}/graphql`,
        changeOrigin: true,
        followRedirects: true,
      },
      '/rest': {
        target: `${backendProxyUrl}/rest`,
        changeOrigin: true,
        followRedirects: true,
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
      target: 'es2022',
    },
  },

  runtimeConfig: {
    public: {
      graphqlBaseUrl: serverUrls.graphqlBaseUrl,
      restBaseUrl: serverUrls.restBaseUrl,
      wsBaseUrl: serverUrls.wsBaseUrl,
      googleSpeechApiKey: process.env.GOOGLE_SPEECH_API_KEY || '',
      
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
        httpEndpoint: serverUrls.graphqlBaseUrl,
        wsEndpoint: serverUrls.wsBaseUrl,
        websocketsOnly: false,
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
    transpile: [
      '@xenova/transformers',
    ],
  }
}

export default defineNuxtConfig(applyElectronConfig(baseConfig))
