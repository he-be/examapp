import { defineConfig } from 'vite'
import { defineConfig as defineVitestConfig } from 'vitest/config'

// Merge Vite and Vitest configs
export default defineConfig(
  defineVitestConfig({
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'json-summary', 'html'],
        reportsDirectory: './coverage',
        exclude: [
          'node_modules/',
          'dist/',
          'e2e/',
          '**/*.d.ts',
          '**/*.config.*',
          'coverage/**'
        ]
      }
    },
    build: {
      target: 'es2022',
      outDir: 'dist',
      emptyOutDir: true,
      minify: true,
      rollupOptions: {
        input: './src/index.ts',
        output: {
          format: 'es'
        }
      }
    },
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  })
)
