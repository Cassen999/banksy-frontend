import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    env: {
      VITE_API_BASE_URL: 'http://localhost:8080',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
      exclude: [
        '**/*.config.{ts,tsx}',
        'src/main.tsx',
        'src/App.tsx',
        'src/**/*.d.ts',
        '**/index.{ts,tsx}',
        '**/*.types.ts',
        'src/types/**',
        'src/assets/**',
        'src/mocks/**',
        'src/test/**',
        '.claude/**',
        'plans/**',
        'reports/**',
        'node_modules/**',
      ],
    },
  },
});
