// vite-electron.config.ts

import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import path from 'path'

export default defineConfig({
  plugins: [
    electron({
      entry: 'electron/main.ts',
      vite: {
        build: {
          outDir: 'dist-electron',
          sourcemap: true,
          minify: process.env.NODE_ENV === 'production',
          target: 'node16', // Adjust based on your Electron version
          lib: {
            entry: path.resolve(__dirname, 'electron/main.ts'),
            formats: ['cjs'],
          },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@electron': path.resolve(__dirname, 'electron'),
    },
  },
})
