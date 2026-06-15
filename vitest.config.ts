import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

const root = import.meta.dirname

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(root, 'src/shared'),
      '@renderer': resolve(root, 'src/renderer/src')
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: { provider: 'v8', include: ['src/**/*.{ts,tsx}'] }
  }
})
