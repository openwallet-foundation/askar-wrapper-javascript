import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // Test the packages from source, like the paths in tsconfig.json
    alias: [{ find: /^@openwallet-foundation\/(.*)$/, replacement: path.resolve(__dirname, 'packages/$1/src') }],
  },
  test: {
    watch: false,
    setupFiles: ['packages/askar-nodejs/tests/setup.ts', 'packages/askar-shared/tests/setup.ts'],
  },
})
