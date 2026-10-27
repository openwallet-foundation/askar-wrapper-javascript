// Switches the example app to another Expo SDK, and with it another React Native version, to run the tests against:
//
//   node harness/use-expo-sdk.mjs <sdk>   e.g. 53 (React Native 0.79) or 55 (React Native 0.83)
//
// Sets expo and the Expo modules the tests use in package.json, and react and react-native in the pnpm catalog, which the
// React Native package shares with the example, to the versions of that SDK. Metro is pinned to the version of that react-native with pnpm overrides:
// React Native Harness takes Metro as a peer dependency, so pnpm would otherwise install the newest Metro next to the one
// Expo uses. Then installs without the lockfile and regenerates the native projects, so the next test run builds the
// app with the new version. Undo it with `git checkout` on the changed files.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const exampleDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const workspaceDir = path.resolve(exampleDir, '../..')

const sdk = process.argv[2]
if (!/^\d+$/.test(sdk ?? '')) {
  console.error('Usage: node harness/use-expo-sdk.mjs <sdk>, e.g. 53')
  process.exit(1)
}

// Undefined when nothing matches the spec, for which npm fails with a 404
const npmView = (spec, field) => {
  try {
    const output = execFileSync('npm', ['view', spec, field, '--json'], { encoding: 'utf8', stdio: 'pipe' }).trim()
    return output ? JSON.parse(output) : undefined
  } catch (error) {
    if (error.stdout?.includes('E404')) return undefined
    throw error
  }
}

// The newest version in a range. `npm view` returns one match as a value and several as an array
const newestVersion = (name, range) => [npmView(`${name}@${range}`, 'version') ?? []].flat().at(-1)

const expoVersion = newestVersion('expo', `~${sdk}.0.0`)
if (!expoVersion) throw new Error(`Expo SDK ${sdk} not found on npm`)

// The versions of react and react-native that the SDK is tested with
const response = await fetch(`https://cdn.jsdelivr.net/npm/expo@${expoVersion}/bundledNativeModules.json`)
if (!response.ok) throw new Error(`Failed to fetch the native module versions of expo@${expoVersion}`)
const bundledNativeModules = await response.json()
const { react, 'react-native': reactNative } = bundledNativeModules

// The Metro version of that react-native, and the metro-* packages it consists of
const metroVersion = newestVersion(
  'metro',
  npmView(`@react-native/community-cli-plugin@${reactNative}`, 'dependencies.metro')
)
const metroPackages = new Set(['metro'])
for (const name of ['metro', 'metro-transform-worker']) {
  for (const dependency of Object.keys(npmView(`${name}@${metroVersion}`, 'dependencies') ?? {})) {
    if (dependency.startsWith('metro')) metroPackages.add(dependency)
  }
}

// expo takes @expo/dom-webview as an optional peer dependency with any version, which pnpm resolves to the newest one,
// while the rest of the SDK needs the one of that SDK. Older SDKs don't have it
const domWebviewVersion = newestVersion('@expo/dom-webview', `~${sdk}.0.0`)

const packageJsonPath = path.join(exampleDir, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
packageJson.dependencies.expo = `~${expoVersion}`
for (const name of ['expo-asset', 'expo-file-system']) packageJson.dependencies[name] = bundledNativeModules[name]
if (domWebviewVersion) packageJson.dependencies['@expo/dom-webview'] = `~${domWebviewVersion}`
else packageJson.dependencies['@expo/dom-webview'] = undefined
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)

const workspacePath = path.join(workspaceDir, 'pnpm-workspace.yaml')
const overrides = [...metroPackages]
  .sort()
  .map((name) => `  ${name}: ${metroVersion}`)
  .join('\n')
const workspace = fs
  .readFileSync(workspacePath, 'utf8')
  .replace(/^ {2}react: .*$/m, `  react: ${react}`)
  .replace(/^ {2}react-native: .*$/m, `  react-native: ${reactNative}`)
  .replace(/\noverrides:\n(?: {2}.*\n)*/, '\n')
fs.writeFileSync(workspacePath, `${workspace.trimEnd()}\n\noverrides:\n${overrides}\n`)

console.log(
  `Using Expo SDK ${sdk}: expo ${expoVersion}, react ${react}, react-native ${reactNative}, metro ${metroVersion}`
)

// Resolve from scratch: with the lockfile, pnpm keeps the locked versions of optional peer dependencies such as
// @expo/dom-webview, which then belong to the SDK the lockfile was made for
fs.rmSync(path.join(workspaceDir, 'pnpm-lock.yaml'))
execFileSync('pnpm', ['install', '--no-frozen-lockfile'], { cwd: workspaceDir, stdio: 'inherit' })

// Regenerate the native projects that an earlier test run generated with the previous SDK
const platforms = ['android', 'ios'].filter((platform) => fs.existsSync(path.join(exampleDir, platform)))
if (platforms.length > 0) {
  const platform = platforms.length === 2 ? 'all' : platforms[0]
  execFileSync('npx', ['expo', 'prebuild', '--clean', '--no-install', '--platform', platform], {
    cwd: exampleDir,
    stdio: 'inherit',
    env: { ...process.env, EXPO_NO_TELEMETRY: '1' },
  })
}
