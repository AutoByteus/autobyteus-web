import { defineNuxtConfig } from 'nuxt/config'
import { applyElectronConfig } from './nuxt.electron.config'

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
    }
  },

  runtimeConfig: {
    public: {
      graphqlBaseUrl: process.env.NUXT_PUBLIC_GRAPHQL_BASE_URL || 'http://localhost:8001/graphql',
      restBaseUrl: process.env.NUXT_PUBLIC_REST_BASE_URL || 'http://localhost:8001/rest',
      wsBaseUrl: process.env.NUXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8001/graphql',
      googleSpeechApiKey: process.env.GOOGLE_SPEECH_API_KEY || '',
      
      audio: {
        targetSampleRate: 16000,
        chunkDuration: 5,
        overlapDuration: 0.2,
        channels: 1,
        transcriptionWsEndpoint: process.env.NUXT_PUBLIC_TRANSCRIPTION_WS_ENDPOINT || 'ws://localhost:8001/ws/transcribe',
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
          : (process.env.NUXT_PUBLIC_GRAPHQL_BASE_URL || 'http://localhost:8001/graphql'),
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
}

export default defineNuxtConfig(applyElectronConfig(baseConfig))
