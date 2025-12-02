import viteTsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [viteTsConfigPaths()],
  test: {
    watch: false,
    setupFiles: ['packages/askar-nodejs/tests/setup.ts'],
  },
})
