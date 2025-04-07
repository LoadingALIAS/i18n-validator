import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 20000,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/data/**',
        'src/**/index.ts',
        'dist/**',
        'node_modules/**',
        'scripts/**',
        '**/*.d.ts'
      ],
      reportsDirectory: './coverage',
      all: true
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
})
