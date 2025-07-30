import { defineConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Merge Vite and Vitest configs
export default defineConfig(
  defineVitestConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
      testTimeout: 30000, // 30 seconds timeout for individual tests
      hookTimeout: 30000, // 30 seconds timeout for hooks
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'json-summary', 'html'],
        reportsDirectory: './coverage',
        exclude: ['node_modules/', 'dist/', 'e2e/', '**/*.d.ts', '**/*.config.*', 'coverage/**'],
      },
    },
    build: {
      target: 'es2022',
      outDir: 'dist',
      emptyOutDir: false, // Workerファイルを保護するためfalseに変更
      minify: true,
      rollupOptions: {
        input: './index.html', // HTMLエントリーポイント
        output: {
          format: 'es',
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  })
);
