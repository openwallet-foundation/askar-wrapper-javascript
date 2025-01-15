import type { Askar } from './Askar'

export let askar: Askar 

export const registerAskar = (options: { askar: Askar }) => (askar = options.askar)
