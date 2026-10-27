import { defineConfig } from 'tsdown'

// Shared by the packages: tsdown looks for its config up from the package directory, and resolves the paths from there
export default defineConfig({
  entry: 'src/index.ts',
  format: 'esm',
  // The Node.js package overrides this with `--platform node`
  platform: 'neutral',
  // tsdown doesn't read the target from tsconfig.json. A language version instead of a runtime, so the output runs on
  // Node.js 22 and in browsers alike. Metro transforms the React Native package for Hermes
  target: 'es2022',
  dts: true,
  sourcemap: true,
  outDir: 'build',
  tsconfig: 'tsconfig.build.json',
})
