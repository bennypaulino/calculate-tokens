import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
  },
  resolve: {
    // Mirrors tsconfig.json "paths". The @/public entry must precede @ so the
    // more specific prefix wins; without it, importing prices.json in a test
    // resolves into src/ and fails.
    alias: [
      { find: /^@\/public\//, replacement: path.resolve(__dirname, 'public') + '/' },
      { find: /^@\//, replacement: path.resolve(__dirname, 'src') + '/' },
    ],
  },
})
