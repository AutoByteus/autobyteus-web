import { defineNuxtConfig } from 'nuxt/config'
import { applyElectronConfig } from './nuxt.electron.config'

// Fixed server port for internal server
const INTERNAL_SERVER_PORT = 29695
const isDevelopment = process.env.NODE_ENV === 'development'
const isElectronBuild = process.env.BUILD_TARGET === 'electron'

// --- Server URL Configuration ---

// For local and Docker development, the Vite proxy forwards API requests to the backend server.
const backendProxyUrl = 'http://localhost:8000'

let serverUrls = {
  graphqlBaseUrl: '',
  restBaseUrl: '',
  graphqlWsEndpoint: '',
  transcriptionWsEndpoint: '',
  terminalWsEndpoint: ''
};

if (isElectronBuild) {
  serverUrls = {
    graphqlBaseUrl: `http://localhost:${INTERNAL_SERVER_PORT}/graphql`,
    restBaseUrl: `http://localhost:${INTERNAL_SERVER_PORT}/rest`,
    graphqlWsEndpoint: `ws://localhost:${INTERNAL_SERVER_PORT}/graphql`,
    transcriptionWsEndpoint: `ws://localhost:${INTERNAL_SERVER_PORT}/transcribe`,
    terminalWsEndpoint: `ws://localhost:${INTERNAL_SERVER_PORT}/ws/terminal`
  };
} else if (isDevelopment) {
  serverUrls = {
    graphqlBaseUrl: '/graphql',
    restBaseUrl: '/rest',
    graphqlWsEndpoint: process.env.BACKEND_GRAPHQL_WS_ENDPOINT || 'ws://localhost:8000/graphql',
    transcriptionWsEndpoint: process.env.BACKEND_TRANSCRIPTION_WS_ENDPOINT || 'ws://localhost:8000/ws/transcribe',
    terminalWsEndpoint: process.env.BACKEND_TERMINAL_WS_ENDPOINT || 'ws://localhost:8000/ws/terminal'
  };
} else {
  // Read from our custom-named environment variables to prevent automatic overrides.
  serverUrls = {
    graphqlBaseUrl: process.env.BACKEND_GRAPHQL_BASE_URL || 'http://localhost:8000/graphql',
    restBaseUrl: process.env.BACKEND_REST_BASE_URL || 'http://localhost:8000/rest',
    graphqlWsEndpoint: process.env.BACKEND_GRAPHQL_WS_ENDPOINT || 'ws://localhost:8000/graphql',
    transcriptionWsEndpoint: process.env.BACKEND_TRANSCRIPTION_WS_ENDPOINT || 'ws://localhost:8000/ws/transcribe',
    terminalWsEndpoint: process.env.BACKEND_TERMINAL_WS_ENDPOINT || 'ws://localhost:8000/ws/terminal'
  };
}

const baseConfig = {
  ssr: false,

  // Disable Nuxt DevTools floating icon
  devtools: {
    enabled: false
  },

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

  // In development, HTTP requests are proxied via vite.server.proxy
  nitro: {
    preset: 'static',
    output: {
      dir: 'dist',
      publicDir: 'dist/public'
    }
  },

  vite: {
    server: {
      proxy: isDevelopment ? {
        '/graphql': {
          target: backendProxyUrl,
          changeOrigin: true,
        },
        '/rest': {
          target: backendProxyUrl,
          changeOrigin: true,
        }
      } : undefined,
    },
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
    // backendUrl is no longer needed as we use Vite's dev proxy
    public: {
      graphqlBaseUrl: serverUrls.graphqlBaseUrl,
      restBaseUrl: serverUrls.restBaseUrl,
      graphqlWsEndpoint: serverUrls.graphqlWsEndpoint,
      terminalWsEndpoint: serverUrls.terminalWsEndpoint,
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
        wsEndpoint: serverUrls.graphqlWsEndpoint,
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
