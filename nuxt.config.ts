import { defineNuxtConfig } from 'nuxt/config'
import { applyElectronConfig } from './nuxt.electron.config'

// Fixed server port for internal server
const INTERNAL_SERVER_PORT = 29695

// Determine if we should use the internal server
// Default to true for Electron builds, false otherwise
const useInternalServer = process.env.USE_INTERNAL_SERVER !== 'false' && 
  (process.env.BUILD_TARGET === 'electron' || process.env.USE_INTERNAL_SERVER === 'true')

// Configure server URLs based on the server mode
function getServerUrls() {
  if (useInternalServer) {
    // When using internal server, use the fixed port
    return {
      graphqlBaseUrl: `http://localhost:${INTERNAL_SERVER_PORT}/graphql`,
      restBaseUrl: `http://localhost:${INTERNAL_SERVER_PORT}/rest`,
      wsBaseUrl: `ws://localhost:${INTERNAL_SERVER_PORT}/graphql`,
      transcriptionWsEndpoint: `ws://localhost:${INTERNAL_SERVER_PORT}/transcribe`
    }
  }
  
  // When using external server, use environment variables
  return {
    graphqlBaseUrl: process.env.NUXT_PUBLIC_GRAPHQL_BASE_URL || 'http://localhost:8000/graphql',
    restBaseUrl: process.env.NUXT_PUBLIC_REST_BASE_URL || 'http://localhost:8000/rest',
    wsBaseUrl: process.env.NUXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8000/graphql',
    transcriptionWsEndpoint: process.env.NUXT_PUBLIC_TRANSCRIPTION_WS_ENDPOINT || 'ws://localhost:8000/ws/transcribe'
  }
}

// Get URLs based on the server mode
const serverUrls = getServerUrls()

console.log('Nuxt config: Using internal server:', useInternalServer)
console.log('Nuxt config: GraphQL URL:', serverUrls.graphqlBaseUrl)
console.log('Nuxt config: REST URL:', serverUrls.restBaseUrl)

const baseConfig = {
  ssr: false,
  
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
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      // Make USE_INTERNAL_SERVER available in the client
      'process.env.USE_INTERNAL_SERVER': JSON.stringify(useInternalServer ? 'true' : 'false')
    }
  },

  runtimeConfig: {
    public: {
      // Use server URLs based on the server mode
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
        httpEndpoint: process.env.NODE_ENV === 'development' 
          ? '/graphql'
          : serverUrls.graphqlBaseUrl,
        wsEndpoint: serverUrls.wsBaseUrl,
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
}

export default defineNuxtConfig(applyElectronConfig(baseConfig))
