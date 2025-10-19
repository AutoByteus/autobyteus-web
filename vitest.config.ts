import { defineVitestConfig } from '@nuxt/test-utils/config'
import path from 'path'

export default defineVitestConfig({
  test: {
    globals: true,
    environment: 'nuxt', // integrates Nuxt runtime, composables, and auto-imports
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom', // or 'jsdom'
      },
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './'), // Adjust this path if your project structure is different
    },
  },
})
