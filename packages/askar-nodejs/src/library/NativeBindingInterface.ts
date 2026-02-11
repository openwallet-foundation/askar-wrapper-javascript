import type { nativeBindings } from './bindings'

// TODO: make this typed
// biome-ignore lint/suspicious/noExplicitAny: cannot use unknown, can be inferred from the  `bindings.ts` but quite complex
export type NativeMethods = Record<keyof typeof nativeBindings, (...args: unknown[]) => any>
