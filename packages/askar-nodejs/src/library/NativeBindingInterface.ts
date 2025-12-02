// With koffi, we don't need complex type mappings since koffi handles
// the function signatures directly from the string declarations

export type NativeMethods = {
  // biome-ignore lint/suspicious/noExplicitAny: koffi generates typed functions from string signatures
  [key: string]: (...args: any[]) => any
}
