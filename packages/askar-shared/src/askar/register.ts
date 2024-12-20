import type { Askar } from './Askar'

export let askar: Askar

export const registerAskar = (ops: { askar: Askar }) => {
  askar = ops.askar
}
