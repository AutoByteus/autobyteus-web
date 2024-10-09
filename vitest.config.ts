// vitest.config.ts
import { defineVitestConfig } from '@nuxt/test-utils/config'
import path from 'path';

export default defineVitestConfig({    
    resolve: {
        alias: {
          '~': path.resolve(__dirname, './'), // Adjust this path if your project structure is different
        },
      },
      test: {
        environment: 'jsdom',
        globals: true,
  },
})
